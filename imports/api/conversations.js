import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

const Conversations = new Mongo.Collection('conversations');

Meteor.methods({
  'conversations.create': ({universityId, name, isPublic, isGroup, members, verified}) => {
      return Conversations.insert({universityId, name, members, isGroup, isPublic, verified, notifications: {}, messages: []});
  },

  // Add a user as a member of a conversation
  'conversations.join': ({conversationId}) => {
    let conversation = Conversations.findOne({_id: conversationId})

    if (conversation && !conversation.isGroup) {
      return
    }

    Conversations.update(
      {_id: conversationId},
      {$push: { members: Meteor.userId() }}
    )
  },

  // Remove a user as a member of a conversation
  'conversations.leave': ({conversationId}) => {
    let conversation = Conversations.findOne({_id: conversationId})

    if (conversation && !conversation.isGroup) {
      return
    }

    Conversations.update(
      {_id: conversationId},
      {$pull: { members: Meteor.userId() }}
    )
  },

  'conversations.sendMessage': ({conversationId, message}) => {
    console.log(conversationId, message)
      // update the messages object
      Conversations.update(
          {_id: conversationId},
          {$push: { messages: message }}
      )
  },
})

Meteor.publish('groups', function() {
  // get cursor for this session
  var cursor = Conversations.find({
    isGroup: true
  })

  return [
    cursor,
  ];
});

Meteor.publish('myGroups', function() {
  // get cursor for this session
  var cursor = Conversations.find({
    isGroup: true,
    members: {
      $in: [Meteor.userId()]
    }
  })

  return [
    cursor,
  ];
});

// Meteor.publish('groupsImIn', function() {
//   // get cursor for this session
//   var cursor = Groups.find({
//     members: {
//       $in: [Meteor.user()._id]
//     }
//   }, {
//       fields: {notifications: 0, messages: 0}
//   })

//   return [
//     cursor,
//   ];
// });

// Meteor.call("conversations.create", {universityId: "9Kn8hjCNex5zP7v4W", name: "Intro to Computer Science II", isGroup: true, members: [], verified: true})