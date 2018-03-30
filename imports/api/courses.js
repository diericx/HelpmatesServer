import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import Universities from './universities';
import Conversations from './conversations';

const Courses = new Mongo.Collection('courses');

Meteor.methods({
    'courses.addOne': ({ universityId, title1, title2, subject }) => {
        const uni = Universities.findOne(universityId);

        if (uni == null) {
            throw new Meteor.Error('courses.addOne.notFound',
            'University by that ID not found');
        }

        // create new conversation
        conversationId = Conversations.insert({messages: []})

        return Courses.insert({ universityId, title1, title2, subject, conversationId });
    },
    
    'courses.getAllForUni': ({universityId}) => {
        const uni = Universities.findOne(universityId);

        if (uni == null) {
            throw new Meteor.Error('courses.addOne.notFound',
            'University by that ID not found');
        }

        return Courses.find({universityId: universityId}).fetch();
    },
})

Meteor.publish('courses', function () {
    return Courses.find({})
});

export default Courses;

// Meteor.call('courses.addOne', 'bJ2ppiHYrMFRThfWE', 'Intro to Computer Science I', 'COMP 1671', 'Computer Science')
