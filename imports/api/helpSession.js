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
                avatar: student.profile.profilePic
            },
            createdAt: new Date(),
            _id: Random.id(),
        }
        // create the messages and notifications for this help session
        var messages = [message]
        var notifications = {}
        notifications[tutorId] = 1
        notifications[student] = 0

        // Send push notification to the tutor
        if (tutor.profile.pushNotificationToken) {
            SendPushNotification(tutor.profile.pushNotificationToken, student.profile.name + " needs help!", message.text)
        }

        // create new help session with link to convo
        return HelpSessions.insert({ studentId, tutorId, courseId, cost, startDate, endDate, hasStudentPayed: false, tutorAccepted: false, tutorDenied: false, tutorStarted: false, studentStarted: false, tutorEnded: false, studentEnded: false,  denyMessage: "", cancelled: false, cancelledBy: null, cancelMessage: "", messages, notifications  });
    },

    'helpSessions.sendMessage': ({sessionId, message}) => {
        const session = HelpSessions.findOne(sessionId)
        // update the messages object
        // set avatar to user who sent message
        if (message.user) {
            message.user.avatar = Meteor.user().profile.profilePic
        }
        HelpSessions.update(
            {_id: sessionId},
            {$push: { "messages": message }}
        )

        // if it's a system message, don't do notifications
        // TODO: Send notifications but don't use message info or else there is an error
        if (message.system === true) {
            return;
        }        
        // get info to update the notifications
        const otherUsersId = message.user._id == session.tutorId ? session.studentId : session.tutorId
        const receiver = Meteor.users.findOne(otherUsersId);
        const currentNotificationValue = session.notifications[otherUsersId] || 0
        const notificationLocation = `notifications.${otherUsersId}`

        // Send push notification to receipiant
        SendPushNotification(receiver.profile.pushNotificationToken, Meteor.user().profile.name + " sent you a message!", message.text)

        HelpSessions.update(
            {_id: sessionId},
            {$set: { [notificationLocation]: currentNotificationValue + 1 }}
        )
    },

    'helpSessions.clearNotificationsForUser': ({sessionId}) => {
        const notificationLocation = `notifications.${Meteor.userId()}`
        HelpSessions.update(
            {_id: sessionId},
            {$set: { [notificationLocation]: 0 }}
        )
    },
    
    'helpSessions.accept': ({ sessionId }) => {
        // find session
        const session = HelpSessions.findOne(sessionId)
        const tutor = Meteor.users.findOne({_id: session.tutorId})
        const student = Meteor.users.findOne({_id: session.studentId});
        // make sure this user has authority to accept a session
        if (session.tutorId == Meteor.userId()) {
            // get info to update the notifications
            const currentNotificationValue = session.notifications[student._id] || 0
            const notificationLocation = `notifications.${student._id}`
            HelpSessions.update(
                {_id: sessionId},
                {$set: {tutorAccepted: true, [notificationLocation]: currentNotificationValue + 1}}
            )

            // send system message update
            const message = {
                text: tutor.profile.name + " accepted! Figure out where to meet.",
                createdAt: new Date(),
                system: true,
                _id: Random.id(),
            }
            // send system message
            Meteor.call("helpSessions.sendMessage", {sessionId: sessionId, message})

            // Send push notification to the student IF they have a notification token
            if (student.profile.pushNotificationToken) {
                SendPushNotification(student.profile.pushNotificationToken, tutor.profile.name + " accepted your request!")
            }

            return true
        }
        return {error: "You do not have access to this session"}
    },
        
    'helpSessions.deny': ({ sessionId }) => {
        // find session
        const session = HelpSessions.findOne(sessionId)
        const tutor = Meteor.users.findOne({_id: session.tutorId})
        const student = Meteor.users.findOne({_id: session.studentId});
        // make sure this user has authority to accept a session
        if (session.tutorId == Meteor.userId()) {
            // get info to update the notifications
            const currentNotificationValue = session.notifications[student._id] || 0
            const notificationLocation = `notifications.${student._id}`    
            HelpSessions.update(
                {_id: sessionId},
                {$set: {tutorDenied: true, [notificationLocation]: currentNotificationValue + 1}}
            )

            // send system message update
            const message = {
                text: tutor.profile.name + " denied your request.",
                createdAt: new Date(),
                system: true,
                _id: Random.id(),
            }
            // send system message
            Meteor.call("helpSessions.sendMessage", {sessionId: sessionId, message})

            // Send push notification to the student IF they have a notification token
            if (student.profile.pushNotificationToken) {
                SendPushNotification(student.profile.pushNotificationToken, tutor.profile.name + " denied your request.")
            }

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
            session.studentEnded = true
        }
        // if they both ended, add an ended date
        if (session.studentEnded && session.tutorEnded) {
            HelpSessions.update(
                {_id: sessionId},
                {$set: {endedAt: new Date()}}
            )
        }
    },
    'helpSessions.start': ({ sessionId }) => {
        const session = HelpSessions.findOne(sessionId)
        const userId = Meteor.userId()
        const tutor = Meteor.users.findOne({_id: session.tutorId})
        const student = Meteor.users.findOne({_id: session.studentId});
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
            // Send push notification to the student IF they have a notification token
            SendPushNotification(student.profile.pushNotificationToken, tutor.profile.name + " started a session.")
        }
        // if the user is the student, set studentAccepted to true
        if (session.studentId == userId) {
            // edit local document so we can check the values later
            session.studentStarted = true
            HelpSessions.update(
                sessionId, 
                {$set: {studentStarted: true}}
            )
            // Send push notification to the student IF they have a notification token
            SendPushNotification(tutor.profile.pushNotificationToken, student.profile.name + " started a session.")
        }
        // set started at if both have started
        if (session.tutorStarted && session.studentStarted) {
            HelpSessions.update(
                sessionId, 
                {$set: {startedAt: new Date()}}
            )
        }
    },

    'helpSessions.confirmPayment': ({ sessionId }) => {
        const session = HelpSessions.findOne(sessionId)
        const userId = Meteor.userId()
        // make sure session exists and this is the right person
        if (!session) {
            return {error: "Session not found"}
        }
        if (session.tutorId != Meteor.userId()) {
            return {error: "You cannot perform this action"}
        }
        // if the user is the tutor, set tutorAccepted to true
            HelpSessions.update(
                sessionId, 
                {$set: {hasStudentPayed: true}})
    }
});

Meteor.publish('mySessions', function () {
    var sessionsCursor = HelpSessions.find({$or: [{studentId: Meteor.userId()}, {tutorId: Meteor.userId()}]}, {
        fields: { "messages": 0 }
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
    var sessionCursor = HelpSessions.find({_id: id}, {
        fields: {"messages": 1}
    })
    // get the data, make sure the session exists
    var sessionData = sessionCursor.fetch(id)
    if (!sessionData) {
        return {error: "Session not found"}
    }

    return [
        sessionCursor,
    ];
});

export default HelpSessions;