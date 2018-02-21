import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import Conversations from './conversations';
import Courses from "./courses";

const HelpSessions = new Mongo.Collection('helpSessions');

Meteor.methods({
    // SETTERS
    'helpSessions.create': ({ userId, tutorId, courseId, startDate, endDate }) => {
        // create new conversation
        conversationId = Conversations.insert({messages: []})
        // create new help session with link to convo
        return HelpSessions.insert({ userId, tutorId, courseId, startDate, endDate, tutorAccepted: false, tutorDenied: false,  denyMessage: "", cancelled: false, cancelledBy: null, cancelMessage: "", conversationId: conversationId  });
    },
    'helpSessions.accept': ({ sessionId }) => {
        // find session
        const session = HelpSessions.findOne(sessionId)
        if (session.tutorId == Meteor.userId()) {
            HelpSessions.update(
                {_id: sessionId},
                {tutorAccepted: true}
            )
            return true
        }
        return false
    },
});

Meteor.publish('mySessions', function () {
    var sessionsCursor = HelpSessions.find({$or: [{userId: Meteor.userId()}, {tutorId: Meteor.userId()}]})
    var sessions = sessionsCursor.fetch()

    var studentIds =  _.pluck(sessions,"userId");
    var tutorIds = _.pluck(sessions,"tutorId");

    var userIds = tutorIds.concat(studentIds);
    var courseIds = _.pluck(sessions, "courseId")

    var usersCursor = Meteor.users.find({
        _id : {$in : userIds}
    });

    var coursesCursor = Courses.find({_id: {$in : courseIds}})

    return [
        sessionsCursor,
        usersCursor,
        coursesCursor,
    ];
});

export default HelpSessions;