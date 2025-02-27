const admin = require('firebase-admin');

const serviceAccount = require('./rfid-access-control-717a7-firebase-adminsdk-fbsvc-981281db41.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


const setAdminRole = async (uid) => {
  try {
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    console.log('Admin role set successfully!');
  } catch (error) {
    console.error('Error setting admin role:', error);
  }
};


