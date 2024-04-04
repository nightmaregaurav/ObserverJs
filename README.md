# ObserverJs

ObserverJs is a lightweight JavaScript library that provides a simple and intuitive way to manage and execute event callbacks. It allows you to register event callbacks, execute them with before and after hooks, and trigger them together.

## Installation
```bash
npm install @nightmaregaurav/observer.js
````

## Usage

```javascript
import { EventScope } from '@nightmaregaurav/observer.js';

// Create an instance of EventScope
const eventScope = new EventScope();

// Register event callbacks
const eventId = eventScope.register(callback);

// Add before, after, and together callbacks
eventScope
    .before(eventId, beforeCallback)
    .after(eventId, afterCallback)
    .together(eventId, togetherCallback);

// Trigger the event
eventScope.trigger(eventId, ...params).then(result => {
    // Handle the result
});
```

## Example

```typescript
function studentLeave(uid: number) {
    console.log("Student", uid, "Left");
}

function teacherLeave(uid: number) {
    console.log("Teacher", uid, "Left");
}

const eventScope = new EventScope();

const studentLeaveEventId = eventScope.register(studentLeave);
const teacherLeaveEventId = eventScope.register(teacherLeave);

eventScope
    .before(studentLeaveEventId, (eventId, eventParams) => console.log("Open The Door"))
    .after(studentLeaveEventId, (eventId, eventParams, hasErrors) => console.log("Close The Door"))
    .before(teacherLeaveEventId, (eventId, eventParams) => console.log("Open The Door"))
    .together(teacherLeaveEventId, (eventId, eventParams) => console.log("Students thank teacher"))
    .after(teacherLeaveEventId, (eventId, eventParams, hasErrors) => console.log("Close The Door"));


const studentLeaveExecutor = eventScope.getExecutor(studentLeaveEventId);
if (studentLeaveExecutor) studentLeaveExecutor(1).then();
// above 2 lines are same as
eventScope.trigger(studentLeaveEventId, 1).then();

`
    >>> Open The Door
    >>> Student 1 Left
    >>> Close The Door
`

const teacherLeaveExecutor = eventScope.getExecutor(teacherLeaveEventId);
if (teacherLeaveExecutor) teacherLeaveExecutor(2).then();
// above 2 lines are same as
eventScope.trigger(teacherLeaveEventId, 2).then();

`
    >>> Open The Door
    >>> Teacher 2 Left  // or "Students thank teacher"
    >>> Students thank teacher  // or "Teacher 2 Left"
    >>> Close The Door
`

```

```javascript
import { EventScope } from 'observer-js';

function onLeave(name) {
    console.log(name, "left");
}

const eventScope = new EventScope();

const leaveEventId = eventScope.register(onLeave);

eventScope
    .before(leaveEventId, () => console.log("Opening the door"))
    .after(leaveEventId, () => console.log("Closing the door"));

const leaveExecutor = eventScope.getExecutor(leaveEventId);
if (leaveExecutor) {
    leaveExecutor("Alice").then(() => {
        console.log("Event executed successfully");
    });
}
```

## License

ObserverJs is released under the MIT License. You can find the full license details in the [LICENSE](LICENSE) file.

Made with ❤️ by [NightmareGaurav](https://github.com/nightmaregaurav).

---
Open For Contribution
---

We welcome contributions from the community! If you have any improvements, bug fixes, or new features to add, please feel free to fork this repository and submit a pull request. We appreciate your contributions!
