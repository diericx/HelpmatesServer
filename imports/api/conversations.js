import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

const Conversations = new Mongo.Collection('conversations');

Meteor.methods({
    'conversations.sendMessage': ({ conversationId, message }) => {
        console.log("convoId: ", conversationId, "message: ", message)
        // const convo = Conversations.findOne(conversationId);
        Conversations.update(
            {_id: conversationId},
            {$push: { messages: message }}
        )

        // return Courses.insert({ universityId, title1, title2, subject });
    },
});

Meteor.publish('thisConversation', function ({id}) {
    return Conversations.find({ _id: id });
});

export default Conversations;