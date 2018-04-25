import { Random } from 'meteor/random'
import { Meteor } from 'meteor/meteor';
import Courses from "./courses";
import Ratings from "./ratings";

Accounts.onCreateUser((options, user) => {
    // send system message update
    const message = {
        _id: Random.id(),
        text: "Give us feedback!",
        createdAt: new Date(),
        system: true,
    }
    // add your extra fields here; don't forget to validate the options, if needed
    _.extend(user, {
        createdAt: new Date(),
        profile: {
            name: options.name,
            completedCourses: {},
            rate: 0,
            availabilities: [],
        },
        messages: [message],
    });

    Meteor.call( 'sendVerificationLink', ( error, response ) => {
        if ( error ) {
            console.log("Error sending verification email.")
        }
    });
    
    return user;
});

Meteor.methods({
    sendVerificationLink() {
        let userId = Meteor.userId();
        if ( userId ) {
            return Accounts.sendVerificationEmail( userId );
        }
    },
    // SETTERS
    'users.setName': ({name}) => {
        var profile = Meteor.user().profile
        
        profile.name = name
        Meteor.users.update(
            Meteor.userId(), 
            { $set: {profile: profile} }
        )
    },

    'user.setProfilePic': ({url}) => {
        var profile = Meteor.user().profile
        profile.profilePic = url
        Meteor.users.update(
            Meteor.userId(), 
            { $set: {profile: profile} }
        )
    },

    'user.setPushNotificationToken': ({token, userId}) => {
        const user = Meteor.users.findOne({_id: userId})
        var profile = user.profile
        profile.pushNotificationToken = token
        Meteor.users.update(
            Meteor.userId(), 
            { $set: {profile: profile} }
        )
    },

    'users.addCompletedCourse': ({courseId, rate}) => {
        // attempt to find user by id
        const user = Meteor.user();
        const course = Courses.findOne(courseId);
        // make sure this user and course exists
        if (!user || !course) {
            return false;
        }
        // update set query
        var set = {profile: user.profile};
        set.profile.completedCourses[courseId] = rate;
        // update completedCourses array in profile
        Meteor.users.update(
            {_id: user._id}, 
            { $set: set }
        )
        return true;
    },

    'users.removeCompletedCourse': ({courseId}) => {
        // update set query
        const user = Meteor.user();
        var set = {profile: user.profile};
        delete set.profile.completedCourses[courseId];
        // apply it
        Meteor.users.update(
            Meteor.userId(), 
            { $set: set }
        )
    },

    'users.setRateForCourse': ({courseId, rate}) => {
        // update set query
        const user = Meteor.user();
        var set = {profile: user.profile};
        set.profile.completedCourses[courseId] = rate;
        // apply it
        Meteor.users.update(
            Meteor.userId(), 
            { $set: set }
        )
    },

    'users.addAvailability': ({date, length, repeats}) => {
        var newAvailability = {"date": date, "length": length, "repeats": repeats}
        Meteor.users.update(
            {_id: Meteor.userId()}, 
            { $addToSet: {"profile.availabilities": newAvailability} }
        )
    },

    // GETTERS
    'users.getAvailabilities': ({userId}) => {
        const user = Meteor.users.findOne(userId)
        
        if (user) {
            const profile = user.profile
            return user.profile.availabilities
        } else {
            return []
        }
        
    },

    'users.getAllWhoCompletedCourse': ({courseId}) => {
        const users = Meteor.users.find(
            { "profile.completedCourses": { $in: [ courseId ] }},
            {fields: { "profile": 1,} 
        }).fetch();

        return users;
    },
})

Meteor.publish('tutors', function () {
    var tutors = Meteor.users.find(
        {"profile.completedCourses": {$ne: []}},
        {
            fields: {
                profile: 1, _id: 1,
            }
        }
    ).fetch()
    // Get reviews for all these users
    var idsForTutors = tutors.map(function(user) { 
        return user._id;
    }); 
    var ratingsCursor = Ratings.find({ targetUserId: { $in: idsForTutors } });
    // Get completed courses for all these users
    var idsForCourses = tutors.map(function(user) { 
        return user.completedCourses;
    })
    idsForCourses = [].concat.apply([], idsForCourses);
    var coursesCursor = Courses.find({ _id: { $in: idsForCourses } });

    // Get ids for users who rated this tutor
    var idsForRaters = ratingsCursor.fetch().map(function(rating) { 
        return rating.userId;
    }); 
    // combine user Ids
    let userIds = idsForTutors.concat(idsForRaters);
    var usersCursor = Meteor.users.find({_id: { $in: userIds } });
    return [
        usersCursor,
        ratingsCursor,
        coursesCursor
    ]
});