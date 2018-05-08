var require = meteorInstall({"imports":{"api":{"courses.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// imports/api/courses.js                                                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Universities;
module.watch(require("./universities"), {
  default(v) {
    Universities = v;
  }

}, 2);
const Courses = new Mongo.Collection('courses');
Meteor.methods({
  'courses.addOne': ({
    universityId,
    title1,
    title2,
    subject
  }) => {
    const uni = Universities.findOne(universityId);

    if (uni == null) {
      throw new Meteor.Error('courses.addOne.notFound', 'University by that ID not found');
    }

    return Courses.insert({
      universityId,
      title1,
      title2,
      subject,
      messages: []
    });
  },
  'courses.sendMessage': ({
    courseId,
    message
  }) => {
    // update the messages object
    Courses.update({
      _id: courseId
    }, {
      $push: {
        messages: message
      }
    });
  } // 'courses.getAllForUni': ({universityId}) => {
  //     const uni = Universities.findOne(universityId);
  //     if (uni == null) {
  //         throw new Meteor.Error('courses.addOne.notFound',
  //         'University by that ID not found');
  //     }
  //     return Courses.find({universityId: universityId}).fetch();
  // },

});
Meteor.publish('courses', function () {
  return Courses.find({}, {
    fields: {
      messages: 0
    }
  });
});
Meteor.publish('course', function ({
  courseId
}) {
  return Courses.find({
    _id: courseId
  });
});
Meteor.publish('myCourses', function () {
  const courses = Meteor.user().profile.completedCourses;
  const courseIds = Object.keys(courses);
  return Courses.find({
    _id: {
      $in: courseIds
    }
  }, {
    fields: {
      messages: 0
    }
  });
});
module.exportDefault(Courses);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"expo.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// imports/api/expo.js                                                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
module.export({
  SendPushNotification: () => SendPushNotification
});
let Expo;
module.watch(require("expo-server-sdk"), {
  default(v) {
    Expo = v;
  }

}, 0);
// Create a new Expo SDK client
let expo = new Expo();

function SendPushNotification(token, title, body) {
  // if the token doesn't exist, don't send the notification
  if (!token) {
    return;
  }

  let messages = [];
  messages.push({
    to: token,
    sound: 'default',
    title: title,
    body: body,
    data: {
      withSome: null
    }
  });
  let chunks = expo.chunkPushNotifications(messages);

  (() => Promise.asyncApply(() => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let receipts = Promise.await(expo.sendPushNotificationsAsync(chunk));
        console.log(receipts);
      } catch (error) {
        console.error(error);
      }
    }
  }))();
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpSession.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// imports/api/helpSession.js                                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 2);
let Courses;
module.watch(require("./courses"), {
  default(v) {
    Courses = v;
  }

}, 3);
let SendPushNotification;
module.watch(require("./expo"), {
  SendPushNotification(v) {
    SendPushNotification = v;
  }

}, 4);
const HelpSessions = new Mongo.Collection('helpSessions');
Meteor.methods({
  // SETTERS
  'helpSessions.create': ({
    studentId,
    tutorId,
    courseId,
    startDate,
    endDate,
    initialMessageText
  }) => {
    // get cost of this session
    tutor = Meteor.users.findOne({
      _id: tutorId
    });
    student = Meteor.users.findOne({
      _id: studentId
    });
    cost = tutor.profile.completedCourses[courseId]; // make sure cost, tutor and student exist

    if (!cost || !tutor || !student) {
      return false;
    } // create initial message


    const initialMessageTextPrefix = "Hi! I need help with ";
    const message = {
      text: initialMessageTextPrefix + initialMessageText,
      user: {
        _id: studentId,
        name: student.profile.name
      },
      createdAt: new Date(),
      _id: Random.id() // create the messages and notifications for this help session

    };
    var messages = [message];
    var notifications = {};
    notifications[tutorId] = 1;
    notifications[student] = 0; // Send push notification to the tutor

    if (tutor.profile.pushNotificationToken) {
      SendPushNotification(tutor.profile.pushNotificationToken, student.profile.name + " needs help!", message.text);
    } // create new help session with link to convo


    return HelpSessions.insert({
      studentId,
      tutorId,
      courseId,
      cost,
      startDate,
      endDate,
      tutorAccepted: false,
      tutorDenied: false,
      tutorStarted: false,
      studentStarted: false,
      tutorEnded: false,
      studentEnded: false,
      denyMessage: "",
      cancelled: false,
      cancelledBy: null,
      cancelMessage: "",
      messages,
      notifications
    });
  },
  'helpSessions.sendMessage': ({
    sessionId,
    message
  }) => {
    const session = HelpSessions.findOne(sessionId); // update the messages object

    HelpSessions.update({
      _id: sessionId
    }, {
      $push: {
        "messages": message
      }
    }); // if it's a system message, don't do notifications
    // TODO: Send notifications but don't use message info or else there is an error

    if (message.system === true) {
      return;
    } // Send push notification to receipiant


    SendPushNotification(receiver.profile.pushNotificationToken, Meteor.user().profile.name + " sent you a message!", message.text); // update the notifications

    const otherUsersId = message.user._id == session.tutorId ? session.studentId : session.tutorId;
    const receiver = Meteor.users.findOne(otherUsersId);
    const currentNotificationValue = session.notifications[otherUsersId] || 0;
    const notificationLocation = `notifications.${otherUsersId}`;
    HelpSessions.update({
      _id: sessionId
    }, {
      $set: {
        [notificationLocation]: currentNotificationValue + 1
      }
    });
  },
  'helpSessions.clearNotificationsForUser': ({
    sessionId
  }) => {
    const notificationLocation = `notifications.${Meteor.userId()}`;
    HelpSessions.update({
      _id: sessionId
    }, {
      $set: {
        [notificationLocation]: 0
      }
    });
  },
  'helpSessions.accept': ({
    sessionId
  }) => {
    // find session
    const session = HelpSessions.findOne(sessionId);
    const tutor = Meteor.users.findOne({
      _id: session.tutorId
    });
    const student = Meteor.users.findOne({
      _id: session.studentId
    }); // make sure this user has authority to accept a session

    if (session.tutorId == Meteor.userId()) {
      HelpSessions.update({
        _id: sessionId
      }, {
        $set: {
          tutorAccepted: true
        }
      }); // send system message update

      const message = {
        text: tutor.profile.name + " accepted! Figure out where to meet.",
        createdAt: new Date(),
        system: true,
        _id: Random.id() // send system message

      };
      Meteor.call("helpSessions.sendMessage", {
        sessionId: sessionId,
        message
      }); // Send push notification to the student IF they have a notification token

      if (student.profile.pushNotificationToken) {
        SendPushNotification(student.profile.pushNotificationToken, tutor.profile.name + " accepted your request!");
      }

      return true;
    }

    return {
      error: "You do not have access to this session"
    };
  },
  'helpSessions.end': ({
    sessionId
  }) => {
    // find session
    const session = HelpSessions.findOne(sessionId);

    if (session.tutorId == Meteor.userId()) {
      HelpSessions.update({
        _id: sessionId
      }, {
        $set: {
          tutorEnded: true
        }
      });
      session.tutorEnded = true;
    } else if (session.studentId == Meteor.userId()) {
      HelpSessions.update({
        _id: sessionId
      }, {
        $set: {
          studentEnded: true
        }
      });
    } // if they both ended, add an ended date


    if (session.studentEnded && session.tutorEnded) {
      HelpSessions.update({
        _id: sessionId
      }, {
        $set: {
          endedAt: new Date()
        }
      });
      session.studentEnded = true;
    }
  },
  'helpSessions.start': ({
    sessionId
  }) => {
    const session = HelpSessions.findOne(sessionId);
    const userId = Meteor.userId(); // make sure session exists

    if (!session) {
      return {
        error: "Session not found"
      };
    } // if the user is the tutor, set tutorAccepted to true


    if (session.tutorId == userId) {
      // edit local document so we can check the values later
      session.tutorStarted = true;
      HelpSessions.update(sessionId, {
        $set: {
          tutorStarted: true
        }
      });
    } // if the user is the student, set studentAccepted to true


    if (session.studentId == userId) {
      // edit local document so we can check the values later
      session.studentStarted = true;
      HelpSessions.update(sessionId, {
        $set: {
          studentStarted: true
        }
      });
    } // set started at if both have started


    if (session.tutorStarted && session.studentStarted) {
      HelpSessions.update(sessionId, {
        $set: {
          startedAt: new Date()
        }
      });
    }
  }
});
Meteor.publish('mySessions', function () {
  var sessionsCursor = HelpSessions.find({
    $or: [{
      studentId: Meteor.userId()
    }, {
      tutorId: Meteor.userId()
    }]
  }, {
    fields: {
      "messages": 0
    }
  });
  var sessions = sessionsCursor.fetch();

  var studentIds = _.pluck(sessions, "studentId");

  var tutorIds = _.pluck(sessions, "tutorId");

  var userIds = tutorIds.concat(studentIds);

  var courseIds = _.pluck(sessions, "courseId");

  var usersCursor = Meteor.users.find({
    _id: {
      $in: userIds
    }
  });
  var coursesCursor = Courses.find({
    _id: {
      $in: courseIds
    }
  });
  return [sessionsCursor, usersCursor, coursesCursor];
});
Meteor.publish('session', function ({
  id
}) {
  // get cursor for this session
  var sessionCursor = HelpSessions.find({
    _id: id
  }, {
    fields: {
      "messages": 1
    }
  }); // get the data, make sure the session exists

  var sessionData = sessionCursor.fetch(id);

  if (!sessionData) {
    return {
      error: "Session not found"
    };
  }

  return [sessionCursor];
});
module.exportDefault(HelpSessions);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"images.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// imports/api/images.js                                                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
Images = new FS.Collection("images", {
  stores: [new FS.Store.FileSystem("images", {
    path: "~/uploads"
  })]
});
Images.allow({
  'insert': function () {
    // add custom authentication code here
    return true;
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ratings.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// imports/api/ratings.js                                                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
const Ratings = new Mongo.Collection('ratings');
Meteor.methods({
  'ratings.rateUser': ({
    userId,
    targetUserId,
    courseId,
    sessionId,
    rating,
    message
  }) => {
    Ratings.insert({
      userId,
      targetUserId,
      courseId,
      sessionId,
      rating,
      message
    });
  }
});
Meteor.publish('ratingsForSession', function ({
  id
}) {
  var ratingsCursor = Ratings.find({
    sessionId: id
  }, {
    fields: {
      _id: 1,
      rating: 1,
      message: 1,
      userId: 1,
      targetId: 1
    }
  });
  return ratingsCursor;
});
module.exportDefault(Ratings);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"universities.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// imports/api/universities.js                                                                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Mongo;
module.watch(require("meteor/mongo"), {
  Mongo(v) {
    Mongo = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
const Universities = new Mongo.Collection('universities');
Meteor.methods({
  'universities.addOne': ({
    name,
    abbreviation,
    state,
    city
  }) => {
    return Universities.insert({
      name,
      abbreviation,
      state,
      city,
      messages: []
    });
  }
});
module.exportDefault(Universities);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"users.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// imports/api/users.js                                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Random;
module.watch(require("meteor/random"), {
  Random(v) {
    Random = v;
  }

}, 0);
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 1);
let Courses;
module.watch(require("./courses"), {
  default(v) {
    Courses = v;
  }

}, 2);
let Ratings;
module.watch(require("./ratings"), {
  default(v) {
    Ratings = v;
  }

}, 3);
Accounts.onCreateUser((options, user) => {
  // send system message update
  const message = {
    _id: Random.id(),
    text: "Give us feedback!",
    createdAt: new Date(),
    system: true // add your extra fields here; don't forget to validate the options, if needed

  };

  _.extend(user, {
    createdAt: new Date(),
    profile: {
      name: options.name,
      completedCourses: {},
      rate: 0,
      availabilities: [[], [], [], [], [], [], []] // availabilities for each day

    },
    messages: [message]
  });

  Meteor.call('sendVerificationLink', (error, response) => {
    if (error) {
      console.log("Error sending verification email.");
    }
  });
  return user;
});
Meteor.methods({
  sendVerificationLink() {
    let userId = Meteor.userId();

    if (userId) {
      return Accounts.sendVerificationEmail(userId);
    }
  },

  // SETTERS
  'users.setName': ({
    name
  }) => {
    var profile = Meteor.user().profile;
    profile.name = name;
    Meteor.users.update(Meteor.userId(), {
      $set: {
        profile: profile
      }
    });
  },
  'user.setProfilePic': ({
    url
  }) => {
    var profile = Meteor.user().profile;
    profile.profilePic = url;
    Meteor.users.update(Meteor.userId(), {
      $set: {
        profile: profile
      }
    });
  },
  'user.setPushNotificationToken': ({
    token,
    userId
  }) => {
    const user = Meteor.users.findOne({
      _id: userId
    });
    var profile = user.profile;
    profile.pushNotificationToken = token;
    Meteor.users.update(Meteor.userId(), {
      $set: {
        profile: profile
      }
    });
  },
  'users.addCompletedCourse': ({
    courseId,
    rate
  }) => {
    // attempt to find user by id
    const user = Meteor.user();
    const course = Courses.findOne(courseId); // make sure this user and course exists

    if (!user || !course) {
      return false;
    } // update set query


    var set = {
      profile: user.profile
    };
    set.profile.completedCourses[courseId] = rate; // update completedCourses array in profile

    Meteor.users.update({
      _id: user._id
    }, {
      $set: set
    });
    return true;
  },
  'users.removeCompletedCourse': ({
    courseId
  }) => {
    // update set query
    const user = Meteor.user();
    var set = {
      profile: user.profile
    };
    delete set.profile.completedCourses[courseId]; // apply it

    Meteor.users.update(Meteor.userId(), {
      $set: set
    });
  },
  'users.setRateForCourse': ({
    courseId,
    rate
  }) => {
    // update set query
    const user = Meteor.user();
    var set = {
      profile: user.profile
    };
    set.profile.completedCourses[courseId] = rate; // apply it

    Meteor.users.update(Meteor.userId(), {
      $set: set
    });
  },
  'users.addAvailability': ({
    dayOfWeek,
    hours,
    minutes,
    duration
  }) => {
    const newAvailability = {
      hours,
      minutes,
      duration
    };
    const availabilities = Meteor.user().profile.availabilities;
    availabilities[dayOfWeek].push(newAvailability);
    Meteor.users.update({
      _id: Meteor.userId()
    }, {
      $set: {
        "profile.availabilities": availabilities
      }
    });
  },
  'users.removeAvailability': ({
    dayOfWeek,
    index
  }) => {
    const availabilities = Meteor.user().profile.availabilities;
    availabilities[dayOfWeek].splice(index, 1);
    Meteor.users.update({
      _id: Meteor.userId()
    }, {
      $set: {
        "profile.availabilities": availabilities
      }
    });
  },
  // GETTERS
  'users.getAvailabilities': ({
    userId
  }) => {
    const user = Meteor.users.findOne(userId);

    if (user) {
      const profile = user.profile;
      return user.profile.availabilities;
    } else {
      return [];
    }
  },
  'users.getAllWhoCompletedCourse': ({
    courseId
  }) => {
    const users = Meteor.users.find({
      "profile.completedCourses": {
        $in: [courseId]
      }
    }, {
      fields: {
        "profile": 1
      }
    }).fetch();
    return users;
  }
});
Meteor.publish('tutors', function () {
  var tutors = Meteor.users.find({
    "profile.completedCourses": {
      $ne: []
    }
  }, {
    fields: {
      profile: 1,
      _id: 1
    }
  }).fetch(); // Get reviews for all these users

  var idsForTutors = tutors.map(function (user) {
    return user._id;
  });
  var ratingsCursor = Ratings.find({
    targetUserId: {
      $in: idsForTutors
    }
  }); // Get completed courses for all these users

  var idsForCourses = tutors.map(function (user) {
    return user.completedCourses;
  });
  idsForCourses = [].concat.apply([], idsForCourses);
  var coursesCursor = Courses.find({
    _id: {
      $in: idsForCourses
    }
  }); // Get ids for users who rated this tutor

  var idsForRaters = ratingsCursor.fetch().map(function (rating) {
    return rating.userId;
  }); // combine user Ids

  let userIds = idsForTutors.concat(idsForRaters);
  var usersCursor = Meteor.users.find({
    _id: {
      $in: userIds
    }
  });
  return [usersCursor, ratingsCursor, coursesCursor];
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"server":{"main.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// server/main.js                                                                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let Meteor;
module.watch(require("meteor/meteor"), {
  Meteor(v) {
    Meteor = v;
  }

}, 0);
module.watch(require("../imports/api/courses"));
module.watch(require("../imports/api/universities"));
module.watch(require("../imports/api/users"));
module.watch(require("../imports/api/helpSession"));
module.watch(require("../imports/api/images"));
module.watch(require("../imports/api/ratings"));
Meteor.startup(() => {// code to run on server at startup
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/server/main.js");
//# sourceURL=meteor://💻app/app/app.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvY291cnNlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvZXhwby5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvaGVscFNlc3Npb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL2ltcG9ydHMvYXBpL2ltYWdlcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvcmF0aW5ncy5qcyIsIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvdW5pdmVyc2l0aWVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS91c2Vycy5qcyIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL21haW4uanMiXSwibmFtZXMiOlsiTW9uZ28iLCJtb2R1bGUiLCJ3YXRjaCIsInJlcXVpcmUiLCJ2IiwiTWV0ZW9yIiwiVW5pdmVyc2l0aWVzIiwiZGVmYXVsdCIsIkNvdXJzZXMiLCJDb2xsZWN0aW9uIiwibWV0aG9kcyIsInVuaXZlcnNpdHlJZCIsInRpdGxlMSIsInRpdGxlMiIsInN1YmplY3QiLCJ1bmkiLCJmaW5kT25lIiwiRXJyb3IiLCJpbnNlcnQiLCJtZXNzYWdlcyIsImNvdXJzZUlkIiwibWVzc2FnZSIsInVwZGF0ZSIsIl9pZCIsIiRwdXNoIiwicHVibGlzaCIsImZpbmQiLCJmaWVsZHMiLCJjb3Vyc2VzIiwidXNlciIsInByb2ZpbGUiLCJjb21wbGV0ZWRDb3Vyc2VzIiwiY291cnNlSWRzIiwiT2JqZWN0Iiwia2V5cyIsIiRpbiIsImV4cG9ydERlZmF1bHQiLCJleHBvcnQiLCJTZW5kUHVzaE5vdGlmaWNhdGlvbiIsIkV4cG8iLCJleHBvIiwidG9rZW4iLCJ0aXRsZSIsImJvZHkiLCJwdXNoIiwidG8iLCJzb3VuZCIsImRhdGEiLCJ3aXRoU29tZSIsImNodW5rcyIsImNodW5rUHVzaE5vdGlmaWNhdGlvbnMiLCJjaHVuayIsInJlY2VpcHRzIiwic2VuZFB1c2hOb3RpZmljYXRpb25zQXN5bmMiLCJjb25zb2xlIiwibG9nIiwiZXJyb3IiLCJSYW5kb20iLCJIZWxwU2Vzc2lvbnMiLCJzdHVkZW50SWQiLCJ0dXRvcklkIiwic3RhcnREYXRlIiwiZW5kRGF0ZSIsImluaXRpYWxNZXNzYWdlVGV4dCIsInR1dG9yIiwidXNlcnMiLCJzdHVkZW50IiwiY29zdCIsImluaXRpYWxNZXNzYWdlVGV4dFByZWZpeCIsInRleHQiLCJuYW1lIiwiY3JlYXRlZEF0IiwiRGF0ZSIsImlkIiwibm90aWZpY2F0aW9ucyIsInB1c2hOb3RpZmljYXRpb25Ub2tlbiIsInR1dG9yQWNjZXB0ZWQiLCJ0dXRvckRlbmllZCIsInR1dG9yU3RhcnRlZCIsInN0dWRlbnRTdGFydGVkIiwidHV0b3JFbmRlZCIsInN0dWRlbnRFbmRlZCIsImRlbnlNZXNzYWdlIiwiY2FuY2VsbGVkIiwiY2FuY2VsbGVkQnkiLCJjYW5jZWxNZXNzYWdlIiwic2Vzc2lvbklkIiwic2Vzc2lvbiIsInN5c3RlbSIsInJlY2VpdmVyIiwib3RoZXJVc2Vyc0lkIiwiY3VycmVudE5vdGlmaWNhdGlvblZhbHVlIiwibm90aWZpY2F0aW9uTG9jYXRpb24iLCIkc2V0IiwidXNlcklkIiwiY2FsbCIsImVuZGVkQXQiLCJzdGFydGVkQXQiLCJzZXNzaW9uc0N1cnNvciIsIiRvciIsInNlc3Npb25zIiwiZmV0Y2giLCJzdHVkZW50SWRzIiwiXyIsInBsdWNrIiwidHV0b3JJZHMiLCJ1c2VySWRzIiwiY29uY2F0IiwidXNlcnNDdXJzb3IiLCJjb3Vyc2VzQ3Vyc29yIiwic2Vzc2lvbkN1cnNvciIsInNlc3Npb25EYXRhIiwiSW1hZ2VzIiwiRlMiLCJzdG9yZXMiLCJTdG9yZSIsIkZpbGVTeXN0ZW0iLCJwYXRoIiwiYWxsb3ciLCJSYXRpbmdzIiwidGFyZ2V0VXNlcklkIiwicmF0aW5nIiwicmF0aW5nc0N1cnNvciIsInRhcmdldElkIiwiYWJicmV2aWF0aW9uIiwic3RhdGUiLCJjaXR5IiwiQWNjb3VudHMiLCJvbkNyZWF0ZVVzZXIiLCJvcHRpb25zIiwiZXh0ZW5kIiwicmF0ZSIsImF2YWlsYWJpbGl0aWVzIiwicmVzcG9uc2UiLCJzZW5kVmVyaWZpY2F0aW9uTGluayIsInNlbmRWZXJpZmljYXRpb25FbWFpbCIsInVybCIsInByb2ZpbGVQaWMiLCJjb3Vyc2UiLCJzZXQiLCJkYXlPZldlZWsiLCJob3VycyIsIm1pbnV0ZXMiLCJkdXJhdGlvbiIsIm5ld0F2YWlsYWJpbGl0eSIsImluZGV4Iiwic3BsaWNlIiwidHV0b3JzIiwiJG5lIiwiaWRzRm9yVHV0b3JzIiwibWFwIiwiaWRzRm9yQ291cnNlcyIsImFwcGx5IiwiaWRzRm9yUmF0ZXJzIiwic3RhcnR1cCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQSxJQUFJQSxLQUFKO0FBQVVDLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxjQUFSLENBQWIsRUFBcUM7QUFBQ0gsUUFBTUksQ0FBTixFQUFRO0FBQUNKLFlBQU1JLENBQU47QUFBUTs7QUFBbEIsQ0FBckMsRUFBeUQsQ0FBekQ7QUFBNEQsSUFBSUMsTUFBSjtBQUFXSixPQUFPQyxLQUFQLENBQWFDLFFBQVEsZUFBUixDQUFiLEVBQXNDO0FBQUNFLFNBQU9ELENBQVAsRUFBUztBQUFDQyxhQUFPRCxDQUFQO0FBQVM7O0FBQXBCLENBQXRDLEVBQTRELENBQTVEO0FBQStELElBQUlFLFlBQUo7QUFBaUJMLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxnQkFBUixDQUFiLEVBQXVDO0FBQUNJLFVBQVFILENBQVIsRUFBVTtBQUFDRSxtQkFBYUYsQ0FBYjtBQUFlOztBQUEzQixDQUF2QyxFQUFvRSxDQUFwRTtBQUlqSyxNQUFNSSxVQUFVLElBQUlSLE1BQU1TLFVBQVYsQ0FBcUIsU0FBckIsQ0FBaEI7QUFFQUosT0FBT0ssT0FBUCxDQUFlO0FBQ1gsb0JBQWtCLENBQUM7QUFBRUMsZ0JBQUY7QUFBZ0JDLFVBQWhCO0FBQXdCQyxVQUF4QjtBQUFnQ0M7QUFBaEMsR0FBRCxLQUErQztBQUM3RCxVQUFNQyxNQUFNVCxhQUFhVSxPQUFiLENBQXFCTCxZQUFyQixD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ZUFBUixDQUFiLEVBQXNDO0FBQUNFLFNBQU9ELENBQVAsRUFBUztBQUFDQyxhQUFPRCxDQUFQO0FBQVM7O0FBQXBCLENBQXRDLEVBQTRELENBQTVEO0FBQStESCxPQUFPQyxLQUFQLENBQWFDLFFBQVEsd0JBQVIsQ0FBYjtBQUFnREYsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLDZCQUFSLENBQWI7QUFBcURGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSxzQkFBUixDQUFiO0FBQThDRixPQUFPQyxLQUFQLENBQWFDLFFBQVEsNEJBQVIsQ0FBYjtBQUFvREYsT0FBT0MsS0FBUCxDQUFhQyxRQUFRLHVCQUFSLENBQWI7QUFBK0NGLE9BQU9DLEtBQVAsQ0FBYUMsUUFBUSx3QkFBUixDQUFiO0FBUWhVRSxPQUFPcUosT0FBUCxDQUFlLE1BQU0sQ0FDbkI7QUFDRCxDQUZELEUiLCJmaWxlIjoiL2FwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbmltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IFVuaXZlcnNpdGllcyBmcm9tICcuL3VuaXZlcnNpdGllcyc7XG5cbmNvbnN0IENvdXJzZXMgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbignY291cnNlcycpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG4gICAgJ2NvdXJzZXMuYWRkT25lJzogKHsgdW5pdmVyc2l0eUlkLCB0aXRsZTEsIHRpdGxlMiwgc3ViamVjdCB9KSA9PiB7XG4gICAgICAgIGNvbnN0IHVuaSA9IFVuaXZlcnNpdGllcy5maW5kT25lKHVuaXZlcnNpdHlJZCk7XG5cbiAgICAgICAgaWYgKHVuaSA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdjb3Vyc2VzLmFkZE9uZS5ub3RGb3VuZCcsXG4gICAgICAgICAgICAnVW5pdmVyc2l0eSBieSB0aGF0IElEIG5vdCBmb3VuZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIENvdXJzZXMuaW5zZXJ0KHsgdW5pdmVyc2l0eUlkLCB0aXRsZTEsIHRpdGxlMiwgc3ViamVjdCwgbWVzc2FnZXM6IFtdfSk7XG4gICAgfSxcblxuICAgICdjb3Vyc2VzLnNlbmRNZXNzYWdlJzogKHtjb3Vyc2VJZCwgbWVzc2FnZX0pID0+IHtcbiAgICAgICAgLy8gdXBkYXRlIHRoZSBtZXNzYWdlcyBvYmplY3RcbiAgICAgICAgQ291cnNlcy51cGRhdGUoXG4gICAgICAgICAgICB7X2lkOiBjb3Vyc2VJZH0sXG4gICAgICAgICAgICB7JHB1c2g6IHsgbWVzc2FnZXM6IG1lc3NhZ2UgfX1cbiAgICAgICAgKVxuICAgIH0sXG4gICAgXG4gICAgLy8gJ2NvdXJzZXMuZ2V0QWxsRm9yVW5pJzogKHt1bml2ZXJzaXR5SWR9KSA9PiB7XG4gICAgLy8gICAgIGNvbnN0IHVuaSA9IFVuaXZlcnNpdGllcy5maW5kT25lKHVuaXZlcnNpdHlJZCk7XG5cbiAgICAvLyAgICAgaWYgKHVuaSA9PSBudWxsKSB7XG4gICAgLy8gICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdjb3Vyc2VzLmFkZE9uZS5ub3RGb3VuZCcsXG4gICAgLy8gICAgICAgICAnVW5pdmVyc2l0eSBieSB0aGF0IElEIG5vdCBmb3VuZCcpO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgcmV0dXJuIENvdXJzZXMuZmluZCh7dW5pdmVyc2l0eUlkOiB1bml2ZXJzaXR5SWR9KS5mZXRjaCgpO1xuICAgIC8vIH0sXG59KVxuXG5NZXRlb3IucHVibGlzaCgnY291cnNlcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gQ291cnNlcy5maW5kKHt9LCB7XG4gICAgICAgIGZpZWxkczogeyBtZXNzYWdlczogMCB9XG4gICAgICB9KTtcbn0pO1xuXG5NZXRlb3IucHVibGlzaCgnY291cnNlJywgZnVuY3Rpb24oe2NvdXJzZUlkfSkge1xuICAgIHJldHVybiBDb3Vyc2VzLmZpbmQoe19pZDogY291cnNlSWR9KTtcbn0pXG5cbk1ldGVvci5wdWJsaXNoKCdteUNvdXJzZXMnLCBmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgY291cnNlcyA9IE1ldGVvci51c2VyKCkucHJvZmlsZS5jb21wbGV0ZWRDb3Vyc2VzO1xuICAgIGNvbnN0IGNvdXJzZUlkcyA9IE9iamVjdC5rZXlzKGNvdXJzZXMpXG4gICAgcmV0dXJuIENvdXJzZXMuZmluZCh7X2lkOiB7JGluOiBjb3Vyc2VJZHN9fSwge1xuICAgICAgICBmaWVsZHM6IHsgbWVzc2FnZXM6IDAgfVxuICAgIH0pO1xufSk7XG5cbmV4cG9ydCBkZWZhdWx0IENvdXJzZXM7XG5cbi8vIE1ldGVvci5jYWxsKCdjb3Vyc2VzLmFkZE9uZScsICdiSjJwcGlIWXJNRlJUaGZXRScsICdJbnRybyB0byBDb21wdXRlciBTY2llbmNlIEknLCAnQ09NUCAxNjcxJywgJ0NvbXB1dGVyIFNjaWVuY2UnKVxuIiwiaW1wb3J0IEV4cG8gZnJvbSAnZXhwby1zZXJ2ZXItc2RrJztcblxuLy8gQ3JlYXRlIGEgbmV3IEV4cG8gU0RLIGNsaWVudFxubGV0IGV4cG8gPSBuZXcgRXhwbygpO1xuXG5leHBvcnQgZnVuY3Rpb24gU2VuZFB1c2hOb3RpZmljYXRpb24odG9rZW4sIHRpdGxlLCBib2R5KSB7XG4gIC8vIGlmIHRoZSB0b2tlbiBkb2Vzbid0IGV4aXN0LCBkb24ndCBzZW5kIHRoZSBub3RpZmljYXRpb25cbiAgaWYgKCF0b2tlbikge1xuICAgIHJldHVybjtcbiAgfVxuICBcbiAgbGV0IG1lc3NhZ2VzID0gW107XG4gIG1lc3NhZ2VzLnB1c2goe1xuICAgICAgdG86IHRva2VuLFxuICAgICAgc291bmQ6ICdkZWZhdWx0JyxcbiAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgIGJvZHk6IGJvZHksXG4gICAgICBkYXRhOiB7IHdpdGhTb21lOiBudWxsIH0sXG4gIH0pXG4gIGxldCBjaHVua3MgPSBleHBvLmNodW5rUHVzaE5vdGlmaWNhdGlvbnMobWVzc2FnZXMpO1xuICAoYXN5bmMgKCkgPT4ge1xuICAgIC8vIFNlbmQgdGhlIGNodW5rcyB0byB0aGUgRXhwbyBwdXNoIG5vdGlmaWNhdGlvbiBzZXJ2aWNlLiBUaGVyZSBhcmVcbiAgICAvLyBkaWZmZXJlbnQgc3RyYXRlZ2llcyB5b3UgY291bGQgdXNlLiBBIHNpbXBsZSBvbmUgaXMgdG8gc2VuZCBvbmUgY2h1bmsgYXQgYVxuICAgIC8vIHRpbWUsIHdoaWNoIG5pY2VseSBzcHJlYWRzIHRoZSBsb2FkIG91dCBvdmVyIHRpbWU6XG4gICAgZm9yIChsZXQgY2h1bmsgb2YgY2h1bmtzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcmVjZWlwdHMgPSBhd2FpdCBleHBvLnNlbmRQdXNoTm90aWZpY2F0aW9uc0FzeW5jKGNodW5rKTtcbiAgICAgICAgY29uc29sZS5sb2cocmVjZWlwdHMpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICB9XG4gICAgfVxuICB9KSgpO1xufSIsImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbmltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgUmFuZG9tIH0gZnJvbSAnbWV0ZW9yL3JhbmRvbSc7XG5cbmltcG9ydCBDb3Vyc2VzIGZyb20gXCIuL2NvdXJzZXNcIjtcbmltcG9ydCB7IFNlbmRQdXNoTm90aWZpY2F0aW9uIH0gZnJvbSBcIi4vZXhwb1wiO1xuXG5jb25zdCBIZWxwU2Vzc2lvbnMgPSBuZXcgTW9uZ28uQ29sbGVjdGlvbignaGVscFNlc3Npb25zJyk7XG5cbk1ldGVvci5tZXRob2RzKHtcbiAgICAvLyBTRVRURVJTXG4gICAgJ2hlbHBTZXNzaW9ucy5jcmVhdGUnOiAoeyBzdHVkZW50SWQsIHR1dG9ySWQsIGNvdXJzZUlkLCBzdGFydERhdGUsIGVuZERhdGUsIGluaXRpYWxNZXNzYWdlVGV4dCB9KSA9PiB7XG4gICAgICAgIC8vIGdldCBjb3N0IG9mIHRoaXMgc2Vzc2lvblxuICAgICAgICB0dXRvciA9IE1ldGVvci51c2Vycy5maW5kT25lKHtfaWQ6IHR1dG9ySWR9KVxuICAgICAgICBzdHVkZW50ID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoe19pZDogc3R1ZGVudElkfSk7XG4gICAgICAgIGNvc3QgPSB0dXRvci5wcm9maWxlLmNvbXBsZXRlZENvdXJzZXNbY291cnNlSWRdXG4gICAgICAgIC8vIG1ha2Ugc3VyZSBjb3N0LCB0dXRvciBhbmQgc3R1ZGVudCBleGlzdFxuICAgICAgICBpZiAoIWNvc3QgfHwgIXR1dG9yIHx8ICFzdHVkZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICAvLyBjcmVhdGUgaW5pdGlhbCBtZXNzYWdlXG4gICAgICAgIGNvbnN0IGluaXRpYWxNZXNzYWdlVGV4dFByZWZpeCA9IFwiSGkhIEkgbmVlZCBoZWxwIHdpdGggXCJcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgIHRleHQ6IGluaXRpYWxNZXNzYWdlVGV4dFByZWZpeCArIGluaXRpYWxNZXNzYWdlVGV4dCxcbiAgICAgICAgICAgIHVzZXI6IHtcbiAgICAgICAgICAgICAgICBfaWQ6IHN0dWRlbnRJZCxcbiAgICAgICAgICAgICAgICBuYW1lOiBzdHVkZW50LnByb2ZpbGUubmFtZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICBfaWQ6IFJhbmRvbS5pZCgpLFxuICAgICAgICB9XG4gICAgICAgIC8vIGNyZWF0ZSB0aGUgbWVzc2FnZXMgYW5kIG5vdGlmaWNhdGlvbnMgZm9yIHRoaXMgaGVscCBzZXNzaW9uXG4gICAgICAgIHZhciBtZXNzYWdlcyA9IFttZXNzYWdlXVxuICAgICAgICB2YXIgbm90aWZpY2F0aW9ucyA9IHt9XG4gICAgICAgIG5vdGlmaWNhdGlvbnNbdHV0b3JJZF0gPSAxXG4gICAgICAgIG5vdGlmaWNhdGlvbnNbc3R1ZGVudF0gPSAwXG5cbiAgICAgICAgLy8gU2VuZCBwdXNoIG5vdGlmaWNhdGlvbiB0byB0aGUgdHV0b3JcbiAgICAgICAgaWYgKHR1dG9yLnByb2ZpbGUucHVzaE5vdGlmaWNhdGlvblRva2VuKSB7XG4gICAgICAgICAgICBTZW5kUHVzaE5vdGlmaWNhdGlvbih0dXRvci5wcm9maWxlLnB1c2hOb3RpZmljYXRpb25Ub2tlbiwgc3R1ZGVudC5wcm9maWxlLm5hbWUgKyBcIiBuZWVkcyBoZWxwIVwiLCBtZXNzYWdlLnRleHQpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBjcmVhdGUgbmV3IGhlbHAgc2Vzc2lvbiB3aXRoIGxpbmsgdG8gY29udm9cbiAgICAgICAgcmV0dXJuIEhlbHBTZXNzaW9ucy5pbnNlcnQoeyBzdHVkZW50SWQsIHR1dG9ySWQsIGNvdXJzZUlkLCBjb3N0LCBzdGFydERhdGUsIGVuZERhdGUsIHR1dG9yQWNjZXB0ZWQ6IGZhbHNlLCB0dXRvckRlbmllZDogZmFsc2UsIHR1dG9yU3RhcnRlZDogZmFsc2UsIHN0dWRlbnRTdGFydGVkOiBmYWxzZSwgdHV0b3JFbmRlZDogZmFsc2UsIHN0dWRlbnRFbmRlZDogZmFsc2UsICBkZW55TWVzc2FnZTogXCJcIiwgY2FuY2VsbGVkOiBmYWxzZSwgY2FuY2VsbGVkQnk6IG51bGwsIGNhbmNlbE1lc3NhZ2U6IFwiXCIsIG1lc3NhZ2VzLCBub3RpZmljYXRpb25zICB9KTtcbiAgICB9LFxuXG4gICAgJ2hlbHBTZXNzaW9ucy5zZW5kTWVzc2FnZSc6ICh7c2Vzc2lvbklkLCBtZXNzYWdlfSkgPT4ge1xuICAgICAgICBjb25zdCBzZXNzaW9uID0gSGVscFNlc3Npb25zLmZpbmRPbmUoc2Vzc2lvbklkKVxuICAgICAgICAvLyB1cGRhdGUgdGhlIG1lc3NhZ2VzIG9iamVjdFxuICAgICAgICBIZWxwU2Vzc2lvbnMudXBkYXRlKFxuICAgICAgICAgICAge19pZDogc2Vzc2lvbklkfSxcbiAgICAgICAgICAgIHskcHVzaDogeyBcIm1lc3NhZ2VzXCI6IG1lc3NhZ2UgfX1cbiAgICAgICAgKVxuXG4gICAgICAgIC8vIGlmIGl0J3MgYSBzeXN0ZW0gbWVzc2FnZSwgZG9uJ3QgZG8gbm90aWZpY2F0aW9uc1xuICAgICAgICAvLyBUT0RPOiBTZW5kIG5vdGlmaWNhdGlvbnMgYnV0IGRvbid0IHVzZSBtZXNzYWdlIGluZm8gb3IgZWxzZSB0aGVyZSBpcyBhbiBlcnJvclxuICAgICAgICBpZiAobWVzc2FnZS5zeXN0ZW0gPT09IHRydWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNlbmQgcHVzaCBub3RpZmljYXRpb24gdG8gcmVjZWlwaWFudFxuICAgICAgICBTZW5kUHVzaE5vdGlmaWNhdGlvbihyZWNlaXZlci5wcm9maWxlLnB1c2hOb3RpZmljYXRpb25Ub2tlbiwgTWV0ZW9yLnVzZXIoKS5wcm9maWxlLm5hbWUgKyBcIiBzZW50IHlvdSBhIG1lc3NhZ2UhXCIsIG1lc3NhZ2UudGV4dClcbiAgICAgICAgXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgbm90aWZpY2F0aW9uc1xuICAgICAgICBjb25zdCBvdGhlclVzZXJzSWQgPSBtZXNzYWdlLnVzZXIuX2lkID09IHNlc3Npb24udHV0b3JJZCA/IHNlc3Npb24uc3R1ZGVudElkIDogc2Vzc2lvbi50dXRvcklkXG4gICAgICAgIGNvbnN0IHJlY2VpdmVyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUob3RoZXJVc2Vyc0lkKTtcbiAgICAgICAgY29uc3QgY3VycmVudE5vdGlmaWNhdGlvblZhbHVlID0gc2Vzc2lvbi5ub3RpZmljYXRpb25zW290aGVyVXNlcnNJZF0gfHwgMFxuICAgICAgICBjb25zdCBub3RpZmljYXRpb25Mb2NhdGlvbiA9IGBub3RpZmljYXRpb25zLiR7b3RoZXJVc2Vyc0lkfWBcbiAgICAgICAgSGVscFNlc3Npb25zLnVwZGF0ZShcbiAgICAgICAgICAgIHtfaWQ6IHNlc3Npb25JZH0sXG4gICAgICAgICAgICB7JHNldDogeyBbbm90aWZpY2F0aW9uTG9jYXRpb25dOiBjdXJyZW50Tm90aWZpY2F0aW9uVmFsdWUgKyAxIH19XG4gICAgICAgIClcbiAgICB9LFxuXG4gICAgJ2hlbHBTZXNzaW9ucy5jbGVhck5vdGlmaWNhdGlvbnNGb3JVc2VyJzogKHtzZXNzaW9uSWR9KSA9PiB7XG4gICAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbkxvY2F0aW9uID0gYG5vdGlmaWNhdGlvbnMuJHtNZXRlb3IudXNlcklkKCl9YFxuICAgICAgICBIZWxwU2Vzc2lvbnMudXBkYXRlKFxuICAgICAgICAgICAge19pZDogc2Vzc2lvbklkfSxcbiAgICAgICAgICAgIHskc2V0OiB7IFtub3RpZmljYXRpb25Mb2NhdGlvbl06IDAgfX1cbiAgICAgICAgKVxuICAgIH0sXG4gICAgXG4gICAgJ2hlbHBTZXNzaW9ucy5hY2NlcHQnOiAoeyBzZXNzaW9uSWQgfSkgPT4ge1xuICAgICAgICAvLyBmaW5kIHNlc3Npb25cbiAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IEhlbHBTZXNzaW9ucy5maW5kT25lKHNlc3Npb25JZClcbiAgICAgICAgY29uc3QgdHV0b3IgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh7X2lkOiBzZXNzaW9uLnR1dG9ySWR9KVxuICAgICAgICBjb25zdCBzdHVkZW50ID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoe19pZDogc2Vzc2lvbi5zdHVkZW50SWR9KTtcbiAgICAgICAgLy8gbWFrZSBzdXJlIHRoaXMgdXNlciBoYXMgYXV0aG9yaXR5IHRvIGFjY2VwdCBhIHNlc3Npb25cbiAgICAgICAgaWYgKHNlc3Npb24udHV0b3JJZCA9PSBNZXRlb3IudXNlcklkKCkpIHtcbiAgICAgICAgICAgIEhlbHBTZXNzaW9ucy51cGRhdGUoXG4gICAgICAgICAgICAgICAge19pZDogc2Vzc2lvbklkfSxcbiAgICAgICAgICAgICAgICB7JHNldDoge3R1dG9yQWNjZXB0ZWQ6IHRydWV9fVxuICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAvLyBzZW5kIHN5c3RlbSBtZXNzYWdlIHVwZGF0ZVxuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IHtcbiAgICAgICAgICAgICAgICB0ZXh0OiB0dXRvci5wcm9maWxlLm5hbWUgKyBcIiBhY2NlcHRlZCEgRmlndXJlIG91dCB3aGVyZSB0byBtZWV0LlwiLFxuICAgICAgICAgICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgICBzeXN0ZW06IHRydWUsXG4gICAgICAgICAgICAgICAgX2lkOiBSYW5kb20uaWQoKSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHNlbmQgc3lzdGVtIG1lc3NhZ2VcbiAgICAgICAgICAgIE1ldGVvci5jYWxsKFwiaGVscFNlc3Npb25zLnNlbmRNZXNzYWdlXCIsIHtzZXNzaW9uSWQ6IHNlc3Npb25JZCwgbWVzc2FnZX0pXG5cbiAgICAgICAgICAgIC8vIFNlbmQgcHVzaCBub3RpZmljYXRpb24gdG8gdGhlIHN0dWRlbnQgSUYgdGhleSBoYXZlIGEgbm90aWZpY2F0aW9uIHRva2VuXG4gICAgICAgICAgICBpZiAoc3R1ZGVudC5wcm9maWxlLnB1c2hOb3RpZmljYXRpb25Ub2tlbikge1xuICAgICAgICAgICAgICAgIFNlbmRQdXNoTm90aWZpY2F0aW9uKHN0dWRlbnQucHJvZmlsZS5wdXNoTm90aWZpY2F0aW9uVG9rZW4sIHR1dG9yLnByb2ZpbGUubmFtZSArIFwiIGFjY2VwdGVkIHlvdXIgcmVxdWVzdCFcIilcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge2Vycm9yOiBcIllvdSBkbyBub3QgaGF2ZSBhY2Nlc3MgdG8gdGhpcyBzZXNzaW9uXCJ9XG4gICAgfSxcbiAgICAnaGVscFNlc3Npb25zLmVuZCc6ICh7IHNlc3Npb25JZCB9KSA9PiB7XG4gICAgICAgIC8vIGZpbmQgc2Vzc2lvblxuICAgICAgICBjb25zdCBzZXNzaW9uID0gSGVscFNlc3Npb25zLmZpbmRPbmUoc2Vzc2lvbklkKVxuICAgICAgICBpZiAoc2Vzc2lvbi50dXRvcklkID09IE1ldGVvci51c2VySWQoKSkge1xuICAgICAgICAgICAgSGVscFNlc3Npb25zLnVwZGF0ZShcbiAgICAgICAgICAgICAgICB7X2lkOiBzZXNzaW9uSWR9LFxuICAgICAgICAgICAgICAgIHskc2V0OiB7dHV0b3JFbmRlZDogdHJ1ZX19XG4gICAgICAgICAgICApXG4gICAgICAgICAgICBzZXNzaW9uLnR1dG9yRW5kZWQgPSB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAoc2Vzc2lvbi5zdHVkZW50SWQgPT0gTWV0ZW9yLnVzZXJJZCgpKXtcbiAgICAgICAgICAgIEhlbHBTZXNzaW9ucy51cGRhdGUoXG4gICAgICAgICAgICAgICAge19pZDogc2Vzc2lvbklkfSxcbiAgICAgICAgICAgICAgICB7JHNldDoge3N0dWRlbnRFbmRlZDogdHJ1ZX19XG4gICAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgdGhleSBib3RoIGVuZGVkLCBhZGQgYW4gZW5kZWQgZGF0ZVxuICAgICAgICBpZiAoc2Vzc2lvbi5zdHVkZW50RW5kZWQgJiYgc2Vzc2lvbi50dXRvckVuZGVkKSB7XG4gICAgICAgICAgICBIZWxwU2Vzc2lvbnMudXBkYXRlKFxuICAgICAgICAgICAgICAgIHtfaWQ6IHNlc3Npb25JZH0sXG4gICAgICAgICAgICAgICAgeyRzZXQ6IHtlbmRlZEF0OiBuZXcgRGF0ZSgpfX1cbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIHNlc3Npb24uc3R1ZGVudEVuZGVkID0gdHJ1ZVxuICAgICAgICB9XG4gICAgfSxcbiAgICAnaGVscFNlc3Npb25zLnN0YXJ0JzogKHsgc2Vzc2lvbklkIH0pID0+IHtcbiAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IEhlbHBTZXNzaW9ucy5maW5kT25lKHNlc3Npb25JZClcbiAgICAgICAgY29uc3QgdXNlcklkID0gTWV0ZW9yLnVzZXJJZCgpXG4gICAgICAgIC8vIG1ha2Ugc3VyZSBzZXNzaW9uIGV4aXN0c1xuICAgICAgICBpZiAoIXNlc3Npb24pIHtcbiAgICAgICAgICAgIHJldHVybiB7ZXJyb3I6IFwiU2Vzc2lvbiBub3QgZm91bmRcIn1cbiAgICAgICAgfVxuICAgICAgICAvLyBpZiB0aGUgdXNlciBpcyB0aGUgdHV0b3IsIHNldCB0dXRvckFjY2VwdGVkIHRvIHRydWVcbiAgICAgICAgaWYgKHNlc3Npb24udHV0b3JJZCA9PSB1c2VySWQpIHtcbiAgICAgICAgICAgIC8vIGVkaXQgbG9jYWwgZG9jdW1lbnQgc28gd2UgY2FuIGNoZWNrIHRoZSB2YWx1ZXMgbGF0ZXJcbiAgICAgICAgICAgIHNlc3Npb24udHV0b3JTdGFydGVkID0gdHJ1ZVxuICAgICAgICAgICAgSGVscFNlc3Npb25zLnVwZGF0ZShcbiAgICAgICAgICAgICAgICBzZXNzaW9uSWQsIFxuICAgICAgICAgICAgICAgIHskc2V0OiB7dHV0b3JTdGFydGVkOiB0cnVlfX1cbiAgICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiB0aGUgdXNlciBpcyB0aGUgc3R1ZGVudCwgc2V0IHN0dWRlbnRBY2NlcHRlZCB0byB0cnVlXG4gICAgICAgIGlmIChzZXNzaW9uLnN0dWRlbnRJZCA9PSB1c2VySWQpIHtcbiAgICAgICAgICAgIC8vIGVkaXQgbG9jYWwgZG9jdW1lbnQgc28gd2UgY2FuIGNoZWNrIHRoZSB2YWx1ZXMgbGF0ZXJcbiAgICAgICAgICAgIHNlc3Npb24uc3R1ZGVudFN0YXJ0ZWQgPSB0cnVlXG4gICAgICAgICAgICBIZWxwU2Vzc2lvbnMudXBkYXRlKFxuICAgICAgICAgICAgICAgIHNlc3Npb25JZCwgXG4gICAgICAgICAgICAgICAgeyRzZXQ6IHtzdHVkZW50U3RhcnRlZDogdHJ1ZX19XG4gICAgICAgICAgICApXG4gICAgICAgIH1cbiAgICAgICAgLy8gc2V0IHN0YXJ0ZWQgYXQgaWYgYm90aCBoYXZlIHN0YXJ0ZWRcbiAgICAgICAgaWYgKHNlc3Npb24udHV0b3JTdGFydGVkICYmIHNlc3Npb24uc3R1ZGVudFN0YXJ0ZWQpIHtcbiAgICAgICAgICAgIEhlbHBTZXNzaW9ucy51cGRhdGUoXG4gICAgICAgICAgICAgICAgc2Vzc2lvbklkLCBcbiAgICAgICAgICAgICAgICB7JHNldDoge3N0YXJ0ZWRBdDogbmV3IERhdGUoKX19XG4gICAgICAgICAgICApXG4gICAgICAgIH1cbiAgICB9XG59KTtcblxuTWV0ZW9yLnB1Ymxpc2goJ215U2Vzc2lvbnMnLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlc3Npb25zQ3Vyc29yID0gSGVscFNlc3Npb25zLmZpbmQoeyRvcjogW3tzdHVkZW50SWQ6IE1ldGVvci51c2VySWQoKX0sIHt0dXRvcklkOiBNZXRlb3IudXNlcklkKCl9XX0sIHtcbiAgICAgICAgZmllbGRzOiB7IFwibWVzc2FnZXNcIjogMCB9XG4gICAgfSlcbiAgICB2YXIgc2Vzc2lvbnMgPSBzZXNzaW9uc0N1cnNvci5mZXRjaCgpXG5cbiAgICB2YXIgc3R1ZGVudElkcyA9ICBfLnBsdWNrKHNlc3Npb25zLFwic3R1ZGVudElkXCIpO1xuICAgIHZhciB0dXRvcklkcyA9IF8ucGx1Y2soc2Vzc2lvbnMsXCJ0dXRvcklkXCIpO1xuXG4gICAgdmFyIHVzZXJJZHMgPSB0dXRvcklkcy5jb25jYXQoc3R1ZGVudElkcyk7XG4gICAgdmFyIGNvdXJzZUlkcyA9IF8ucGx1Y2soc2Vzc2lvbnMsIFwiY291cnNlSWRcIilcblxuICAgIHZhciB1c2Vyc0N1cnNvciA9IE1ldGVvci51c2Vycy5maW5kKHtcbiAgICAgICAgX2lkIDogeyRpbiA6IHVzZXJJZHN9XG4gICAgfSk7XG5cbiAgICB2YXIgY291cnNlc0N1cnNvciA9IENvdXJzZXMuZmluZCh7X2lkOiB7JGluIDogY291cnNlSWRzfX0pXG5cbiAgICByZXR1cm4gW1xuICAgICAgICBzZXNzaW9uc0N1cnNvcixcbiAgICAgICAgdXNlcnNDdXJzb3IsXG4gICAgICAgIGNvdXJzZXNDdXJzb3IsXG4gICAgXTtcbn0pO1xuXG5NZXRlb3IucHVibGlzaCgnc2Vzc2lvbicsIGZ1bmN0aW9uKHtpZH0pIHtcbiAgICAvLyBnZXQgY3Vyc29yIGZvciB0aGlzIHNlc3Npb25cbiAgICB2YXIgc2Vzc2lvbkN1cnNvciA9IEhlbHBTZXNzaW9ucy5maW5kKHtfaWQ6IGlkfSwge1xuICAgICAgICBmaWVsZHM6IHtcIm1lc3NhZ2VzXCI6IDF9XG4gICAgfSlcbiAgICAvLyBnZXQgdGhlIGRhdGEsIG1ha2Ugc3VyZSB0aGUgc2Vzc2lvbiBleGlzdHNcbiAgICB2YXIgc2Vzc2lvbkRhdGEgPSBzZXNzaW9uQ3Vyc29yLmZldGNoKGlkKVxuICAgIGlmICghc2Vzc2lvbkRhdGEpIHtcbiAgICAgICAgcmV0dXJuIHtlcnJvcjogXCJTZXNzaW9uIG5vdCBmb3VuZFwifVxuICAgIH1cblxuICAgIHJldHVybiBbXG4gICAgICAgIHNlc3Npb25DdXJzb3IsXG4gICAgXTtcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBIZWxwU2Vzc2lvbnM7IiwiSW1hZ2VzID0gbmV3IEZTLkNvbGxlY3Rpb24oXCJpbWFnZXNcIiwge1xuICAgIHN0b3JlczogW25ldyBGUy5TdG9yZS5GaWxlU3lzdGVtKFwiaW1hZ2VzXCIsIHtwYXRoOiBcIn4vdXBsb2Fkc1wifSldXG59KTtcblxuSW1hZ2VzLmFsbG93KHtcbiAgICAnaW5zZXJ0JzogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBhZGQgY3VzdG9tIGF1dGhlbnRpY2F0aW9uIGNvZGUgaGVyZVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59KTsiLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcblxuY29uc3QgUmF0aW5ncyA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCdyYXRpbmdzJyk7XG5cbk1ldGVvci5tZXRob2RzKHtcbiAgICAncmF0aW5ncy5yYXRlVXNlcic6ICh7dXNlcklkLCB0YXJnZXRVc2VySWQsIGNvdXJzZUlkLCBzZXNzaW9uSWQsIHJhdGluZywgbWVzc2FnZX0pID0+IHtcbiAgICAgICAgUmF0aW5ncy5pbnNlcnQoe3VzZXJJZCwgdGFyZ2V0VXNlcklkLCBjb3Vyc2VJZCwgc2Vzc2lvbklkLCByYXRpbmcsIG1lc3NhZ2V9KVxuICAgIH0sXG59KVxuXG5NZXRlb3IucHVibGlzaCgncmF0aW5nc0ZvclNlc3Npb24nLCBmdW5jdGlvbiAoe2lkfSkge1xuICAgIHZhciByYXRpbmdzQ3Vyc29yID0gUmF0aW5ncy5maW5kKHtzZXNzaW9uSWQ6IGlkfSwge1xuICAgICAgICBmaWVsZHM6IHtfaWQ6IDEsIHJhdGluZzogMSwgbWVzc2FnZTogMSwgdXNlcklkOiAxLCB0YXJnZXRJZDogMX1cbiAgICB9KVxuXG4gICAgcmV0dXJuIHJhdGluZ3NDdXJzb3I7XG59KTtcblxuZXhwb3J0IGRlZmF1bHQgUmF0aW5nczsiLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcblxuY29uc3QgVW5pdmVyc2l0aWVzID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ3VuaXZlcnNpdGllcycpO1xuXG5NZXRlb3IubWV0aG9kcyh7XG4gICAgJ3VuaXZlcnNpdGllcy5hZGRPbmUnOiAoeyBuYW1lLCBhYmJyZXZpYXRpb24sIHN0YXRlLCBjaXR5IH0pID0+IHtcbiAgICAgICAgcmV0dXJuIFVuaXZlcnNpdGllcy5pbnNlcnQoeyBuYW1lLCBhYmJyZXZpYXRpb24sIHN0YXRlLCBjaXR5LCBtZXNzYWdlczogW10gfSk7XG4gICAgfSxcbn0pXG5cbmV4cG9ydCBkZWZhdWx0IFVuaXZlcnNpdGllcztcbiIsImltcG9ydCB7IFJhbmRvbSB9IGZyb20gJ21ldGVvci9yYW5kb20nXG5pbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCBDb3Vyc2VzIGZyb20gXCIuL2NvdXJzZXNcIjtcbmltcG9ydCBSYXRpbmdzIGZyb20gXCIuL3JhdGluZ3NcIjtcblxuQWNjb3VudHMub25DcmVhdGVVc2VyKChvcHRpb25zLCB1c2VyKSA9PiB7XG4gICAgLy8gc2VuZCBzeXN0ZW0gbWVzc2FnZSB1cGRhdGVcbiAgICBjb25zdCBtZXNzYWdlID0ge1xuICAgICAgICBfaWQ6IFJhbmRvbS5pZCgpLFxuICAgICAgICB0ZXh0OiBcIkdpdmUgdXMgZmVlZGJhY2shXCIsXG4gICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgc3lzdGVtOiB0cnVlLFxuICAgIH1cbiAgICAvLyBhZGQgeW91ciBleHRyYSBmaWVsZHMgaGVyZTsgZG9uJ3QgZm9yZ2V0IHRvIHZhbGlkYXRlIHRoZSBvcHRpb25zLCBpZiBuZWVkZWRcbiAgICBfLmV4dGVuZCh1c2VyLCB7XG4gICAgICAgIGNyZWF0ZWRBdDogbmV3IERhdGUoKSxcbiAgICAgICAgcHJvZmlsZToge1xuICAgICAgICAgICAgbmFtZTogb3B0aW9ucy5uYW1lLFxuICAgICAgICAgICAgY29tcGxldGVkQ291cnNlczoge30sXG4gICAgICAgICAgICByYXRlOiAwLFxuICAgICAgICAgICAgYXZhaWxhYmlsaXRpZXM6IFtbXSxbXSxbXSxbXSxbXSxbXSxbXV0sIC8vIGF2YWlsYWJpbGl0aWVzIGZvciBlYWNoIGRheVxuICAgICAgICB9LFxuICAgICAgICBtZXNzYWdlczogW21lc3NhZ2VdLFxuICAgIH0pO1xuXG4gICAgTWV0ZW9yLmNhbGwoICdzZW5kVmVyaWZpY2F0aW9uTGluaycsICggZXJyb3IsIHJlc3BvbnNlICkgPT4ge1xuICAgICAgICBpZiAoIGVycm9yICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJFcnJvciBzZW5kaW5nIHZlcmlmaWNhdGlvbiBlbWFpbC5cIilcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiB1c2VyO1xufSk7XG5cbk1ldGVvci5tZXRob2RzKHtcbiAgICBzZW5kVmVyaWZpY2F0aW9uTGluaygpIHtcbiAgICAgICAgbGV0IHVzZXJJZCA9IE1ldGVvci51c2VySWQoKTtcbiAgICAgICAgaWYgKCB1c2VySWQgKSB7XG4gICAgICAgICAgICByZXR1cm4gQWNjb3VudHMuc2VuZFZlcmlmaWNhdGlvbkVtYWlsKCB1c2VySWQgKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLy8gU0VUVEVSU1xuICAgICd1c2Vycy5zZXROYW1lJzogKHtuYW1lfSkgPT4ge1xuICAgICAgICB2YXIgcHJvZmlsZSA9IE1ldGVvci51c2VyKCkucHJvZmlsZVxuICAgICAgICBcbiAgICAgICAgcHJvZmlsZS5uYW1lID0gbmFtZVxuICAgICAgICBNZXRlb3IudXNlcnMudXBkYXRlKFxuICAgICAgICAgICAgTWV0ZW9yLnVzZXJJZCgpLCBcbiAgICAgICAgICAgIHsgJHNldDoge3Byb2ZpbGU6IHByb2ZpbGV9IH1cbiAgICAgICAgKVxuICAgIH0sXG5cbiAgICAndXNlci5zZXRQcm9maWxlUGljJzogKHt1cmx9KSA9PiB7XG4gICAgICAgIHZhciBwcm9maWxlID0gTWV0ZW9yLnVzZXIoKS5wcm9maWxlXG4gICAgICAgIHByb2ZpbGUucHJvZmlsZVBpYyA9IHVybFxuICAgICAgICBNZXRlb3IudXNlcnMudXBkYXRlKFxuICAgICAgICAgICAgTWV0ZW9yLnVzZXJJZCgpLCBcbiAgICAgICAgICAgIHsgJHNldDoge3Byb2ZpbGU6IHByb2ZpbGV9IH1cbiAgICAgICAgKVxuICAgIH0sXG5cbiAgICAndXNlci5zZXRQdXNoTm90aWZpY2F0aW9uVG9rZW4nOiAoe3Rva2VuLCB1c2VySWR9KSA9PiB7XG4gICAgICAgIGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh7X2lkOiB1c2VySWR9KVxuICAgICAgICB2YXIgcHJvZmlsZSA9IHVzZXIucHJvZmlsZVxuICAgICAgICBwcm9maWxlLnB1c2hOb3RpZmljYXRpb25Ub2tlbiA9IHRva2VuXG4gICAgICAgIE1ldGVvci51c2Vycy51cGRhdGUoXG4gICAgICAgICAgICBNZXRlb3IudXNlcklkKCksIFxuICAgICAgICAgICAgeyAkc2V0OiB7cHJvZmlsZTogcHJvZmlsZX0gfVxuICAgICAgICApXG4gICAgfSxcblxuICAgICd1c2Vycy5hZGRDb21wbGV0ZWRDb3Vyc2UnOiAoe2NvdXJzZUlkLCByYXRlfSkgPT4ge1xuICAgICAgICAvLyBhdHRlbXB0IHRvIGZpbmQgdXNlciBieSBpZFxuICAgICAgICBjb25zdCB1c2VyID0gTWV0ZW9yLnVzZXIoKTtcbiAgICAgICAgY29uc3QgY291cnNlID0gQ291cnNlcy5maW5kT25lKGNvdXJzZUlkKTtcbiAgICAgICAgLy8gbWFrZSBzdXJlIHRoaXMgdXNlciBhbmQgY291cnNlIGV4aXN0c1xuICAgICAgICBpZiAoIXVzZXIgfHwgIWNvdXJzZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIHVwZGF0ZSBzZXQgcXVlcnlcbiAgICAgICAgdmFyIHNldCA9IHtwcm9maWxlOiB1c2VyLnByb2ZpbGV9O1xuICAgICAgICBzZXQucHJvZmlsZS5jb21wbGV0ZWRDb3Vyc2VzW2NvdXJzZUlkXSA9IHJhdGU7XG4gICAgICAgIC8vIHVwZGF0ZSBjb21wbGV0ZWRDb3Vyc2VzIGFycmF5IGluIHByb2ZpbGVcbiAgICAgICAgTWV0ZW9yLnVzZXJzLnVwZGF0ZShcbiAgICAgICAgICAgIHtfaWQ6IHVzZXIuX2lkfSwgXG4gICAgICAgICAgICB7ICRzZXQ6IHNldCB9XG4gICAgICAgIClcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgICd1c2Vycy5yZW1vdmVDb21wbGV0ZWRDb3Vyc2UnOiAoe2NvdXJzZUlkfSkgPT4ge1xuICAgICAgICAvLyB1cGRhdGUgc2V0IHF1ZXJ5XG4gICAgICAgIGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuICAgICAgICB2YXIgc2V0ID0ge3Byb2ZpbGU6IHVzZXIucHJvZmlsZX07XG4gICAgICAgIGRlbGV0ZSBzZXQucHJvZmlsZS5jb21wbGV0ZWRDb3Vyc2VzW2NvdXJzZUlkXTtcbiAgICAgICAgLy8gYXBwbHkgaXRcbiAgICAgICAgTWV0ZW9yLnVzZXJzLnVwZGF0ZShcbiAgICAgICAgICAgIE1ldGVvci51c2VySWQoKSwgXG4gICAgICAgICAgICB7ICRzZXQ6IHNldCB9XG4gICAgICAgIClcbiAgICB9LFxuXG4gICAgJ3VzZXJzLnNldFJhdGVGb3JDb3Vyc2UnOiAoe2NvdXJzZUlkLCByYXRlfSkgPT4ge1xuICAgICAgICAvLyB1cGRhdGUgc2V0IHF1ZXJ5XG4gICAgICAgIGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcigpO1xuICAgICAgICB2YXIgc2V0ID0ge3Byb2ZpbGU6IHVzZXIucHJvZmlsZX07XG4gICAgICAgIHNldC5wcm9maWxlLmNvbXBsZXRlZENvdXJzZXNbY291cnNlSWRdID0gcmF0ZTtcbiAgICAgICAgLy8gYXBwbHkgaXRcbiAgICAgICAgTWV0ZW9yLnVzZXJzLnVwZGF0ZShcbiAgICAgICAgICAgIE1ldGVvci51c2VySWQoKSwgXG4gICAgICAgICAgICB7ICRzZXQ6IHNldCB9XG4gICAgICAgIClcbiAgICB9LFxuXG4gICAgJ3VzZXJzLmFkZEF2YWlsYWJpbGl0eSc6ICh7ZGF5T2ZXZWVrLCBob3VycywgbWludXRlcywgZHVyYXRpb259KSA9PiB7XG4gICAgICAgIGNvbnN0IG5ld0F2YWlsYWJpbGl0eSA9IHtob3VycywgbWludXRlcywgZHVyYXRpb259XG4gICAgICAgIGNvbnN0IGF2YWlsYWJpbGl0aWVzID0gTWV0ZW9yLnVzZXIoKS5wcm9maWxlLmF2YWlsYWJpbGl0aWVzXG4gICAgICAgIGF2YWlsYWJpbGl0aWVzW2RheU9mV2Vla10ucHVzaChuZXdBdmFpbGFiaWxpdHkpXG4gICAgICAgIE1ldGVvci51c2Vycy51cGRhdGUoXG4gICAgICAgICAgICB7X2lkOiBNZXRlb3IudXNlcklkKCl9LCBcbiAgICAgICAgICAgIHsgJHNldDoge1wicHJvZmlsZS5hdmFpbGFiaWxpdGllc1wiOiBhdmFpbGFiaWxpdGllc30gfVxuICAgICAgICApXG4gICAgfSxcblxuICAgICd1c2Vycy5yZW1vdmVBdmFpbGFiaWxpdHknOiAoe2RheU9mV2VlaywgaW5kZXh9KSA9PiB7XG4gICAgICAgIGNvbnN0IGF2YWlsYWJpbGl0aWVzID0gTWV0ZW9yLnVzZXIoKS5wcm9maWxlLmF2YWlsYWJpbGl0aWVzXG4gICAgICAgIGF2YWlsYWJpbGl0aWVzW2RheU9mV2Vla10uc3BsaWNlKGluZGV4LCAxKVxuICAgICAgICBNZXRlb3IudXNlcnMudXBkYXRlKFxuICAgICAgICAgICAge19pZDogTWV0ZW9yLnVzZXJJZCgpfSwgXG4gICAgICAgICAgICB7ICRzZXQ6IHtcInByb2ZpbGUuYXZhaWxhYmlsaXRpZXNcIjogYXZhaWxhYmlsaXRpZXN9IH1cbiAgICAgICAgKVxuICAgIH0sXG5cbiAgICAvLyBHRVRURVJTXG4gICAgJ3VzZXJzLmdldEF2YWlsYWJpbGl0aWVzJzogKHt1c2VySWR9KSA9PiB7XG4gICAgICAgIGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZSh1c2VySWQpXG4gICAgICAgIFxuICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgY29uc3QgcHJvZmlsZSA9IHVzZXIucHJvZmlsZVxuICAgICAgICAgICAgcmV0dXJuIHVzZXIucHJvZmlsZS5hdmFpbGFiaWxpdGllc1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfSxcblxuICAgICd1c2Vycy5nZXRBbGxXaG9Db21wbGV0ZWRDb3Vyc2UnOiAoe2NvdXJzZUlkfSkgPT4ge1xuICAgICAgICBjb25zdCB1c2VycyA9IE1ldGVvci51c2Vycy5maW5kKFxuICAgICAgICAgICAgeyBcInByb2ZpbGUuY29tcGxldGVkQ291cnNlc1wiOiB7ICRpbjogWyBjb3Vyc2VJZCBdIH19LFxuICAgICAgICAgICAge2ZpZWxkczogeyBcInByb2ZpbGVcIjogMSx9IFxuICAgICAgICB9KS5mZXRjaCgpO1xuXG4gICAgICAgIHJldHVybiB1c2VycztcbiAgICB9LFxufSlcblxuTWV0ZW9yLnB1Ymxpc2goJ3R1dG9ycycsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdHV0b3JzID0gTWV0ZW9yLnVzZXJzLmZpbmQoXG4gICAgICAgIHtcInByb2ZpbGUuY29tcGxldGVkQ291cnNlc1wiOiB7JG5lOiBbXX19LFxuICAgICAgICB7XG4gICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgICBwcm9maWxlOiAxLCBfaWQ6IDEsXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApLmZldGNoKClcbiAgICAvLyBHZXQgcmV2aWV3cyBmb3IgYWxsIHRoZXNlIHVzZXJzXG4gICAgdmFyIGlkc0ZvclR1dG9ycyA9IHR1dG9ycy5tYXAoZnVuY3Rpb24odXNlcikgeyBcbiAgICAgICAgcmV0dXJuIHVzZXIuX2lkO1xuICAgIH0pOyBcbiAgICB2YXIgcmF0aW5nc0N1cnNvciA9IFJhdGluZ3MuZmluZCh7IHRhcmdldFVzZXJJZDogeyAkaW46IGlkc0ZvclR1dG9ycyB9IH0pO1xuICAgIC8vIEdldCBjb21wbGV0ZWQgY291cnNlcyBmb3IgYWxsIHRoZXNlIHVzZXJzXG4gICAgdmFyIGlkc0ZvckNvdXJzZXMgPSB0dXRvcnMubWFwKGZ1bmN0aW9uKHVzZXIpIHsgXG4gICAgICAgIHJldHVybiB1c2VyLmNvbXBsZXRlZENvdXJzZXM7XG4gICAgfSlcbiAgICBpZHNGb3JDb3Vyc2VzID0gW10uY29uY2F0LmFwcGx5KFtdLCBpZHNGb3JDb3Vyc2VzKTtcbiAgICB2YXIgY291cnNlc0N1cnNvciA9IENvdXJzZXMuZmluZCh7IF9pZDogeyAkaW46IGlkc0ZvckNvdXJzZXMgfSB9KTtcblxuICAgIC8vIEdldCBpZHMgZm9yIHVzZXJzIHdobyByYXRlZCB0aGlzIHR1dG9yXG4gICAgdmFyIGlkc0ZvclJhdGVycyA9IHJhdGluZ3NDdXJzb3IuZmV0Y2goKS5tYXAoZnVuY3Rpb24ocmF0aW5nKSB7IFxuICAgICAgICByZXR1cm4gcmF0aW5nLnVzZXJJZDtcbiAgICB9KTsgXG4gICAgLy8gY29tYmluZSB1c2VyIElkc1xuICAgIGxldCB1c2VySWRzID0gaWRzRm9yVHV0b3JzLmNvbmNhdChpZHNGb3JSYXRlcnMpO1xuICAgIHZhciB1c2Vyc0N1cnNvciA9IE1ldGVvci51c2Vycy5maW5kKHtfaWQ6IHsgJGluOiB1c2VySWRzIH0gfSk7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgdXNlcnNDdXJzb3IsXG4gICAgICAgIHJhdGluZ3NDdXJzb3IsXG4gICAgICAgIGNvdXJzZXNDdXJzb3JcbiAgICBdXG59KTsiLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCAnLi4vaW1wb3J0cy9hcGkvY291cnNlcyc7XG5pbXBvcnQgJy4uL2ltcG9ydHMvYXBpL3VuaXZlcnNpdGllcyc7XG5pbXBvcnQgJy4uL2ltcG9ydHMvYXBpL3VzZXJzJztcbmltcG9ydCAnLi4vaW1wb3J0cy9hcGkvaGVscFNlc3Npb24nO1xuaW1wb3J0ICcuLi9pbXBvcnRzL2FwaS9pbWFnZXMnO1xuaW1wb3J0ICcuLi9pbXBvcnRzL2FwaS9yYXRpbmdzJztcblxuTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAvLyBjb2RlIHRvIHJ1biBvbiBzZXJ2ZXIgYXQgc3RhcnR1cFxufSk7XG4iXX0=
