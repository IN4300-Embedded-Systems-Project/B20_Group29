#include <WiFi.h>
#include <FirebaseESP32.h>
#include <ESP32Servo.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WiFiUdp.h>
#include <NTPClient.h>

// WiFi Credentials
#define WIFI_SSID "***********"
#define WIFI_PASSWORD "************"

FirebaseAuth auth;
FirebaseConfig config;
// Firebase Credentials
#define FIREBASE_HOST "*******************************"
#define FIREBASE_AUTH "******************************"

// RFID Module Pins (Updated for ESP32)
#define SS_PIN 5   // GPIO5 (D5)
#define RST_PIN 22 // GPIO22 (D22)

// Servo Motor Pin
#define SERVO_PIN 13 // GPIO13 (D13)

// Initialize RFID, Servo, and Firebase
MFRC522 rfid(SS_PIN, RST_PIN);
Servo doorServo;
FirebaseData fbData;

// NTP Time Setup
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800, 60000); // 5.30

void setup()
{
    Serial.begin(9600);

    // Connect to WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Connecting to WiFi");
    while (WiFi.status() != WL_CONNECTED)
    {
        Serial.print(".");
        delay(1000);
    }
    Serial.println("\nConnected to WiFi");

    // Connect to Firebase
    config.host = FIREBASE_HOST;
    config.signer.tokens.legacy_token = FIREBASE_AUTH;

    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    // Start NTP Time Client
    timeClient.begin();

    // Initialize RFID Reader
    SPI.begin();
    rfid.PCD_Init();

    // Attach Servo and lock the door initially
    doorServo.attach(SERVO_PIN);
    doorServo.write(0); // Locked position

    Serial.println("System Ready!");
}

void loop()
{
    // Update the NTP time
    timeClient.update();
    int currentHour = timeClient.getHours();
    time_t currentEpoch = timeClient.getEpochTime();
    time_t epochTime = timeClient.getEpochTime(); // Get current time in seconds
    struct tm *timeInfo = localtime(&epochTime);  // Convert to time structure

    int year = timeInfo->tm_year + 1900;
    int month = timeInfo->tm_mon + 1;
    int day = timeInfo->tm_mday;
    int hour = timeInfo->tm_hour;
    int minute = timeInfo->tm_min;
    int second = timeInfo->tm_sec;

    // Format date-time as a string
    String dateTime = String(year) + "-" + String(month) + "-" + String(day) + " " + String(hour) + ":" + String(minute) + ":" + String(second);

    // Generate ID for access log
    String logID = String(random(100000, 999999));
    String access_control = "/access_control";
    String logPath = "/access_logs/" + logID; // Unique log ID as key

    // manual or automatic seslection
    if (Firebase.getString(fbData, access_control) && fbData.stringData() == "automatic")
    {

        // Check if the RFID card is present
        if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial())
        {
            return;
        }

        // Read the RFID Card UID
        String cardUID = "";
        for (byte i = 0; i < rfid.uid.size; i++)
        {
            cardUID += String(rfid.uid.uidByte[i], HEX);
        }
        cardUID.toUpperCase();

        Serial.print("Scanned Card UID: ");
        Serial.println(cardUID);

        String path = "/users/" + cardUID + "/status";
        String userName = "/users/" + cardUID + "/name";
        String batch = "/users/" + cardUID + "/batch";

        Firebase.getString(fbData, userName);
        userName = fbData.stringData();
        Firebase.getString(fbData, batch);
        batch = fbData.stringData();

        String accessStartStr, accessEndStr;
        int accessStartHour = 0, accessEndHour = 0; // Store extracted hours as integers

        // Fetch start time
        if (Firebase.getString(fbData, "/schedules/lab_8/" + batch + "/start"))
        {
            accessStartStr = fbData.stringData();
            Serial.println("Start time fetched: " + accessStartStr);

            int tIndex = accessStartStr.indexOf('T');
            int dotIndex = accessStartStr.indexOf(':');

            if (tIndex != -1 && dotIndex != -1)
            {
                String hourStr = accessStartStr.substring(tIndex + 1, dotIndex);
                accessStartHour = hourStr.toInt(); // Convert to integer
                Serial.println("Extracted Start Hour: " + String(accessStartHour));
            }
        }
        else
        {
            Serial.println("Failed to get start time!");
        }

        // Fetch end time
        if (Firebase.getString(fbData, "/schedules/lab_8/" + batch + "/end"))
        {
            accessEndStr = fbData.stringData();
            Serial.println("End time fetched: " + accessEndStr);

            int tIndex = accessEndStr.indexOf('T');
            int dotIndex = accessEndStr.indexOf(':');

            if (tIndex != -1 && dotIndex != -1)
            {
                String hourStr = accessEndStr.substring(tIndex + 1, dotIndex);
                accessEndHour = hourStr.toInt(); // Convert to integer
                Serial.println("Extracted End Hour: " + String(accessEndHour));
            }
        }
        else
        {
            Serial.println("Failed to get end time!");
        }

        // Check if the card is authorized in Firebase
        if (Firebase.getString(fbData, path) && fbData.stringData() == "Allowed")
        {

            // Check time-based access control
            if (currentHour >= accessStartHour && currentHour < accessEndHour)
            {

                Serial.println("Access Granted (Within Time)");

                Firebase.setString(fbData, logPath + "/CardID", cardUID);
                Firebase.setString(fbData, logPath + "/Time", dateTime);
                Firebase.setString(fbData, logPath + "/Status", "Access Granted");
                Firebase.setString(fbData, logPath + "/user", userName);

                // Unlock the door (Rotate Servo to 90°)
                doorServo.write(90);
                Serial.println("Door Unlocked");

                // Wait for 3 seconds before locking
                delay(3000);

                // Lock the door (Rotate Servo back to 0°)
                doorServo.write(0);
                Serial.println("Door Locked");
            }
            else
            {
                Serial.println("Access Denied (Out of Time Range)");
                Firebase.setString(fbData, logPath + "/CardID", cardUID);
                Firebase.setString(fbData, logPath + "/Time", dateTime);
                Firebase.setString(fbData, logPath + "/Status", "Access Denied (Out of Time Range)");
                Firebase.setString(fbData, logPath + "/user", userName);
            }
        }
        else
        {
            Serial.println("Access Denied (Unauthorized Card)");
            Firebase.setString(fbData, logPath + "/CardID", cardUID);
            Firebase.setString(fbData, logPath + "/Time", dateTime);
            Firebase.setString(fbData, logPath + "/Status", "Access Denied (Unauthorized Card)");
            Firebase.setString(fbData, logPath + "/user", userName);
        }

        // Halt RFID reader to prevent multiple reads
        rfid.PICC_HaltA();
        rfid.PCD_StopCrypto1();

        delay(2000); // Wait before next scan
    }
    else
    {

        String lab_8_lock = "/door_lock/lab_8";

        if (Firebase.getString(fbData, lab_8_lock) && fbData.stringData() == "Unlocked")
        {

            doorServo.write(90);
            Serial.println("Door Unlocked");

            Firebase.setString(fbData, logPath + "/CardID", "-");
            Firebase.setString(fbData, logPath + "/Time", dateTime);
            Firebase.setString(fbData, logPath + "/Status", "Manually Unlocked");
            Firebase.setString(fbData, logPath + "/user", "admin");

            // Wait for 3 seconds before locking
            delay(5000);

            // Lock the door (Rotate Servo back to 0°)
            doorServo.write(0);
            Serial.println("Door Locked");

            Firebase.setString(fbData, "/door_lock/lab_8", "Locked");
        }
    }
}