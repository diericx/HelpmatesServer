Accounts.onCreateUser((options, user) => {
    // add your extra fields here; don't forget to validate the options, if needed
    _.extend(user, {
        createdAt: new Date(),
        profile: {
            name: options.name,
            imageId: null,
            completedCourses: [],
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

    'users.setRate': ({rate}) => {
        Meteor.users.update(
            Meteor.userId(), 
            { $set: {"profile.rate": rate} }
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
        console.log("userId: ", userId)
        const user = Meteor.users.findOne(userId)
        
        if (user != 'undefined') {
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

    'users.addCompletedCourse': ({courseId}) => {
        // attempt to find user by id
        const user = Meteor.user();
        // make sure this user exists
        if (user == null) {
            return false;
        }

        // update completedCourses array in profile
        Meteor.users.update(
            {_id: user._id}, 
            { $addToSet: {"profile.completedCourses": courseId} }
        )
        return true;
    }
})