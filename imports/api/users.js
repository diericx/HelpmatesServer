Accounts.onCreateUser((options, user) => {
    // add your extra fields here; don't forget to validate the options, if needed
    _.extend(user, {
        createdAt: new Date(),
        profile: {
            name: options.name,
            completedCourses: []
        }
    });
    
    return user;
});

Meteor.methods({
    'users.setName': ({name}) => {
        var profile = Meteor.user().profile
        profile.name = name
        Meteor.users.update(
            Meteor.userId(), 
            { $set: {profile: profile} }
        )
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