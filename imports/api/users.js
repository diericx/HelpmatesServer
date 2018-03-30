import Courses from "./courses";
import Ratings from "./ratings";
import Conversations from "./conversations";

Accounts.onCreateUser((options, user) => {
    // create support conversation for this user
    conversationId = Conversations.insert({messages: []})

    // add your extra fields here; don't forget to validate the options, if needed
    _.extend(user, {
        createdAt: new Date(),
        profile: {
            name: options.name,
            supportConversationId: conversationId,
            profilePic: null,
            completedCourses: {},
            rate: 0,
            availabilities: [],
        }
    });
    
    return user;
});

Meteor.methods({
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