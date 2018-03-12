import Courses from "./courses";

Accounts.onCreateUser((options, user) => {
    // add your extra fields here; don't forget to validate the options, if needed
    _.extend(user, {
        createdAt: new Date(),
        profile: {
            name: options.name,
            imageId: null,
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

    'users.setProfileImage': ({image}) => {
        FS.Utility.eachFile(event, function(image) {
            Images.insert(file, function (err, fileObj) {
                if (err) {
                    return false;
                } else {
                    // update profile to include profile image id
                    Meteor.users.update(
                        Meteor.userId(), 
                        { $set: {"profile.imageId": fileObj_id} }
                    )
                    return true;
                }
                // Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP
            });
        });
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
        console.log(newAvailability)
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
    )
    return tutors
});