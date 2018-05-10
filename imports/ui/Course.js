import React, { Component } from 'react';
import ReactDOM from 'react-dom';

// Task component - represents a single todo item
export default class Course extends Component {

  render() {
    return (
      <li>
        {this.props.course.title1}
      </li>
    );
  }
}