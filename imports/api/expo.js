import Expo from 'expo-server-sdk';

// Create a new Expo SDK client
let expo = new Expo();

export function SendPushNotification(token, title, body) {
  let messages = [];
  messages.push({
      to: tutor.profile.pushNotificationToken,
      sound: 'default',
      title: title,
      body: body,
      data: { withSome: null },
  })
  let chunks = expo.chunkPushNotifications(messages);
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let receipts = await expo.sendPushNotificationsAsync(chunk);
        console.log(receipts);
      } catch (error) {
        console.error(error);
      }
    }
  })();
}