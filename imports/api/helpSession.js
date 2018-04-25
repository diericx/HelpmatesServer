import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import Courses from "./courses";
import { SendPushNotification } from "./expo";

const HelpSessions = new Mongo.Collection('helpSessions');

Meteor.methods({
    // SETTERS
    'helpSessions.create': ({ studentId, tutorId, courseId, startDate, endDate, initialMessageText }) => {
        // get cost of this session
        tutor = Meteor.users.findOne({_id: tutorId})
        student = Meteor.users.findOne({_id: studentId});
        cost = tutor.profile.completedCourses[courseId]
        // make sure cost, tutor and student exist
        if (!cost || !tutor || !student) {
            return false
        }
        // create initial message
        const initialMessageTextPrefix = "Hi! I need help with "
        const message = {
            text: initialMessageTextPrefix + initialMessageText,
            user: {
                _id: studentId,
                name: student.profile.name,
            },
            createdAt: new Date(),
            _id: Random.id(),
        }
        // create the conversation for this help session
        var conversation = {
            messages: [message], 
            notifications: {}
        }
        // set the notification for the tutor
        conversation.notifications[studentId] = 1

        // Send push notification to the tutor
        if (tutor.profile.pushNotificationToken) {
            SendPushNotification(tutor.profile.pushNotificationToken, student.profile.name + " needs help!", message.text)
        }

        // create new help session with link to convo
        return HelpSessions.insert({ studentId, tutorId, courseId, cost, startDate, endDate, tutorAccepted: false, tutorDenied: false, tutorStarted: false, studentStarted: false, tutorEnded: false, studentEnded: false,  denyMessage: "", cancelled: false, cancelledBy: null, cancelMessage: "", conversation  });
    },

    'helpSessions.sendMessage': ({sessionId, message}) => {
        const session = HelpSessions.findOne(sessionId)
        const otherUsersId = message.user._id == session.tutorId ? session.studentId : session.tutorId

        // update the messages object
        HelpSessions.update(
            {_id: sessionId},
            {$push: { "conversation.messages": message }}
        )
        
        // update the notifications
        const currentNotificationValue = session.conversation.notifications[otherUsersId]
        const notificationLocation = `conversation.notifications.${otherUsersId}`
        HelpSessions.update(
            {_id: sessionId},
            {$set: { [notificationLocation]: currentNotificationValue + 1 }}
        )
    },
    
    'helpSessions.accept': ({ sessionId }) => {
        // find session
        const session = HelpSessions.findOne(sessionId)
        const tutor = Meteor.users.findOne({_id: session.tutorId})
        const student = Meteor.users.findOne({_id: studentId});
        // make sure this user has authority to accept a session
        if (session.tutorId == Meteor.userId()) {
            HelpSessions.update(
                {_id: sessionId},
                {$set: {tutorAccepted: true}}
            )

            // send system message update
            const message = {
                _id: Random.id(),
                text: tutor.profile.name + " accepted! Figure out where to meet.",
                createdAt: new Date(),
                system: true,
            }
            // send system message
            Meteor.call("helpSessions.sendMessage", {conversationId: session.conversationId, message})

            // Send push notification to the student
            SendPushNotification(student.profile.pushNotificationToken, tutor.profile.name + " accepted your request!")

            return true
        }
        return {error: "You do not have access to this session"}
    },
    'helpSessions.end': ({ sessionId }) => {
        // find session
        const session = HelpSessions.findOne(sessionId)
        if (session.tutorId == Meteor.userId()) {
            HelpSessions.update(
                {_id: sessionId},
                {$set: {tutorEnded: true}}
            )
            session.tutorEnded = true
        } else if (session.studentId == Meteor.userId()){
            HelpSessions.update(
                {_id: sessionId},
                {$set: {studentEnded: true}}
            )
        }
        // if they both ended, add an ended date
        if (session.studentEnded && session.tutorEnded) {
            HelpSessions.update(
                {_id: sessionId},
                {$set: {endedAt: new Date()}}
            )
            session.studentEnded = true
        }
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
        fields: { conversation: 0 }
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

    return [
        sessionCursor,
    ];
});

export default HelpSessions;