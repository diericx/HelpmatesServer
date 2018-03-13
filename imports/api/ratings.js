import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

const Ratings = new Mongo.Collection('ratings');

Meteor.methods({
    'ratings.rateUser': ({userId, targetUserId, courseId, sessionId, rating, message}) => {
        Ratings.insert({userId, targetUserId, courseId, sessionId, rating, message})
    },
})

export default Ratings;