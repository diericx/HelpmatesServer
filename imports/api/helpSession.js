import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import Conversations from './conversations';
import Courses from "./courses";

const HelpSessions = new Mongo.Collection('helpSessions');

Meteor.methods({
    // SETTERS
    'helpSessions.create': ({ studentId, tutorId, courseId, startDate, endDate }) => {
        // create new conversation
        conversationId = Conversations.insert({messages: []})
        // create new help session with link to convo
        return HelpSessions.insert({ studentId, tutorId, courseId, startDate, endDate, tutorAccepted: false, tutorDenied: false, tutorStarted: false, studentStarted: false,  denyMessage: "", cancelled: false, cancelledBy: null, cancelMessage: "", conversationId: conversationId  });
    },
    'helpSessions.accept': ({ sessionId }) => {
        // find session
        const session = HelpSessions.findOne(sessionId)
        if (session.tutorId == Meteor.userId()) {
            HelpSessions.update(
                {_id: sessionId},
                {$set: {tutorAccepted: true}}
            )
            return true
        }
        return {error: "You do not have access to this session"}
    },
    'helpSessions.start': ({ sessionId }) => {
        const session = HelpSessions.findOne(sessionId)
        const userId = Meteor.userId()
        // make sure session exists
        if (!session) {
            return {error: "Session not found"}
        }
        // if the user is the tutor, set tutorAccepted to true
        if (session.tutorId == userId) {
            // edit local document so we can check the values later
            session.tutorStarted = true
            HelpSessions.update(
                sessionId, 
                {$set: {tutorStarted: true}}
            )
        }
        // if the user is the student, set studentAccepted to true
        if (session.studentId == userId) {
            // edit local document so we can check the values later
            session.studentStarted = true
            HelpSessions.update(
                sessionId, 
                {$set: {studentStarted: true}}
            )
        }
        // set started at if both have started
        if (session.tutorStarted && session.studentStarted) {
            HelpSessions.update(
                sessionId, 
                {$set: {startedAt: new Date()}}
            )
        }
    }
});

Meteor.publish('mySessions', function () {
    var sessionsCursor = HelpSessions.find({$or: [{studentId: Meteor.userId()}, {tutorId: Meteor.userId()}]}, {
        fields: {_id: 1, courseId: 1, studentId: 1, tutorId: 1, tutorAccepted: 1, tutorDenied: 1, cancelled: 1}
    })
    var sessions = sessionsCursor.fetch()

    var studentIds =  _.pluck(sessions,"studentId");
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

Meteor.publish('session', function({id}) {
    // get cursor for this session
    var sessionCursor = HelpSessions.find({_id: id})
    // get the data, make sure the session exists
    var sessionData = HelpSessions.findOne(id)
    if (!sessionData) {
        return {error: "Session not found"}
    }
    // get cursors for each user and conversation
    var conversationCursor = Conversations.find({_id: sessionData.conversationId})

    return [
        sessionCursor,
        conversationCursor,
    ];
});

export default HelpSessions;