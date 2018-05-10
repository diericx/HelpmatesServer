import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import Universities from '../api/universities';
import Courses from '../api/courses';

import University from './University.js';
import Course from './Course.js';
 
// App component - represents the whole app
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }

    // bind
    this.onUniversityClick = this.onUniversityClick.bind(this);
  }


  handleNewCourseSubmit(event) {
    event.preventDefault();
    if (!this.state.selectedUniversity) {
      return
    }

    const universityId = this.state.selectedUniversity._id
    const title1 = ReactDOM.findDOMNode(this.refs.title1).value.trim();
    const title2 = ReactDOM.findDOMNode(this.refs.title2).value.trim();
    const subject = ReactDOM.findDOMNode(this.refs.subject).value.trim();

    Meteor.call("courses.addOne", {
      universityId, 
      title1,
      title2,
      subject
    })
  }

  onUniversityClick(university) {
    this.setState({
      selectedUniversity: university,
      courses: Courses.find({universityId: university._id})
    })
  }

  renderUniversities() {
    return this.props.universities.map((university) => (
      <University key={university._id} university={university} onClick={this.onUniversityClick} />
    ));
  }

  renderCourses() {
    if (!this.state.courses) {
      return
    }
    return this.state.courses.map((course) => (
      <Course key={course._id} course={course} />
    ));
  }

  renderAddCourseForm() {
    if (!this.state.selectedUniversity) {
      return
    }
    return (
      <form className="new-course" onSubmit={this.handleNewCourseSubmit.bind(this)} >
        <input
          type="text"
          ref="title1"
          placeholder="Title1"
        />
        <input
          type="text"
          ref="title2"
          placeholder="Title2"
        />
        <input
          type="text"
          ref="subject"
          placeholder="Subject"
        />
        <input type="submit" value="Submit" />
      </form>
    )
  }
 
  render() {
    if (!Meteor.user() || !Meteor.user().profile.isAdmin) {
      return null
    }
    return (
      <div className="container">
        <div className="containerMini">
          <header>
            <h1>University List</h1>
          </header>
          <ul>
            {this.renderUniversities()}
          </ul>
        </div>

        <div className="containerMini courseList">
          <header>
            <h1>Course List</h1>
          </header>
  
          <ul>
            <div>
            {this.renderAddCourseForm()}
            </div>
            {this.renderCourses()}
          </ul>
        </div>
      </div>
    );
  }
}

export default withTracker(() => {
  Meteor.subscribe('universities')
  Meteor.subscribe('courses')

  return {
    universities: Universities.find({}).fetch(),
  };
})(App);