import React, { Component } from 'react';
import ReactDOM from 'react-dom';

// Task component - represents a single todo item
export default class University extends Component {

  render() {
    return (
      <li>
        {this.props.university.name}
        <button onClick={() => this.props.onClick(this.props.university)}>
          Select
        </button>
      </li>
    );
  }
}