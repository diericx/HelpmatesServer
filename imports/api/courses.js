import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import Universities from './universities';

const Courses = new Mongo.Collection('courses');

Meteor.methods({
    'courses.addOne': ({ universityId, title1, title2, subject }) => {
        const uni = Universities.findOne(universityId);

        if (uni == null) {
            throw new Meteor.Error('courses.addOne.notFound',
            'University by that ID not found');
        }

        return Courses.insert({ universityId, title1, title2, subject, conversation: {messages: []} });
    },

    'courses.sendMessage': ({courseId, message}) => {
        // update the messages object
        Courses.update(
            {_id: courseId},
            {$push: { "conversation.messages": message }}
        )
    },
    
    // 'courses.getAllForUni': ({universityId}) => {
    //     const uni = Universities.findOne(universityId);

    //     if (uni == null) {
    //         throw new Meteor.Error('courses.addOne.notFound',
    //         'University by that ID not found');
    //     }

    //     return Courses.find({universityId: universityId}).fetch();
    // },
})

Meteor.publish('courses', function () {
    return Courses.find({}, {
        fields: { conversation: 0 }
      });
});

Meteor.publish('course', function({courseId}) {
    return Courses.find({_id: courseId});
})

Meteor.publish('myCourses', function () {
    const courses = Meteor.user().profile.completedCourses;
    const courseIds = Object.keys(courses)
    return Courses.find({_id: {$in: courseIds}}, {
        fields: { conversation: 0 }
    });
});

export default Courses;

// Meteor.call('courses.addOne', 'bJ2ppiHYrMFRThfWE', 'Intro to Computer Science I', 'COMP 1671', 'Computer Science')
