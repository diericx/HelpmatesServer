import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

const Ratings = new Mongo.Collection('ratings');

Meteor.methods({
    'ratings.rateUser': ({userId, targetUserId, courseId, sessionId, rating, message}) => {
        Ratings.insert({userId, targetUserId, courseId, sessionId, rating, message})
    },
})

Meteor.publish('ratingsForSession', function ({id}) {
    var ratingsCursor = Ratings.find({sessionId: id}, {
        fields: {_id: 1, rating: 1, message: 1, userId: 1, targetId: 1}
    })

    return ratingsCursor;
});

export default Ratings;