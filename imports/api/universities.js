import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

const Universities = new Mongo.Collection('universities');

Meteor.methods({
    'universities.addOne': ({ name, abbreviation, state, city }) => {
        return Universities.insert({ name, abbreviation, state, city });
    },
})

export default Universities;
