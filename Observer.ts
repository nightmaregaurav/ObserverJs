type EventId = string;
type AfterCallback<T extends unknown[]> = (eventId: EventId, eventParams: T, hasErrors: boolean) => void;
type EventCallback<T extends unknown[]> = (eventId: EventId, eventParams: T) => void;
type RealCallback<T extends unknown[], TT> = (...eventParams: T) => TT;

export class EventScope {
    private events: Map<EventId, RealCallback<any, any>> = new Map();
    private beforeCallbacks: Map<EventId, EventCallback<any>[]> = new Map();
    private afterCallbacks: Map<EventId, AfterCallback<any>[]> = new Map();
    private togetherCallbacks: Map<EventId, EventCallback<any>[]> = new Map();

    register<T extends unknown[], TT>(callback: RealCallback<T, TT>): EventId {
        const eventId = this.generateEventId();
        this.events.set(eventId, callback);
        return eventId;
    }

    before<T extends unknown[]>(eventId: EventId, callback: EventCallback<T>): EventScope {
        const previousCallbacks = this.beforeCallbacks.get(eventId) as EventCallback<T>[] ?? [];
        this.beforeCallbacks.set(eventId, [...previousCallbacks, callback]);
        return this;
    }

    after<T extends unknown[]>(eventId: EventId, callback: AfterCallback<T>): EventScope {
        const previousCallbacks = this.afterCallbacks.get(eventId) as AfterCallback<T>[] ?? [];
        this.afterCallbacks.set(eventId, [...previousCallbacks, callback]);
        return this;
    }

    together<T extends unknown[]>(eventId: EventId, callback: EventCallback<T>): EventScope {
        const previousCallbacks = this.togetherCallbacks.get(eventId) as EventCallback<T>[] ?? [];
        this.togetherCallbacks.set(eventId, [...previousCallbacks, callback]);
        return this;
    }

    getExecutor<T extends unknown[], TT>(eventId: EventId): ((...params: T) => Promise<TT | undefined>) | undefined {
        if (this.events.has(eventId)) {
            return async (...args: T) => {
                await this.triggerBeforeCallbacks<T>(eventId, args);
                let hasError = false;
                try {
                    return await this.triggerTogetherCallbacks<T, TT>(eventId, args);
                } catch (e) {
                    hasError = true;
                } finally {
                    await this.triggerAfterCallbacks<T>(eventId, args, hasError);
                }
            };
        }
        return undefined;
    }

    async trigger<T extends unknown[], TT>(eventId: EventId, ...params: T): Promise<TT | undefined> {
        const executor = this.getExecutor<T, TT>(eventId);
        return executor ? await executor(...params) : undefined;
    }

    private async triggerBeforeCallbacks<T extends unknown[]>(eventId: EventId, eventParams: T): Promise<void> {
        try {
            const callbacks = this.beforeCallbacks.get(eventId) as EventCallback<T>[] ?? [];
            await Promise.all(callbacks.map(callback => new Promise((resolve) => {
                resolve(callback(eventId, eventParams));
            })));
        } catch (error) {
            return;
        }
    }

    private async triggerAfterCallbacks<T extends unknown[]>(eventId: EventId, eventParams: T, hasError: boolean): Promise<void> {
        try {
            const callbacks = this.afterCallbacks.get(eventId) as AfterCallback<T>[] ?? [];
            await Promise.all(callbacks.map(callback => new Promise((resolve) => {
                resolve(callback(eventId, eventParams, hasError));
            })));
        } catch (error) {
            return;
        }
    }

    private async triggerTogetherCallbacks<T extends unknown[], TT>(eventId: EventId, eventParams: T): Promise<TT> {
        const realCallback = this.events.get(eventId) as RealCallback<T, TT>;
        const callbacks = this.togetherCallbacks.get(eventId) as EventCallback<T>[] ?? [];
        const results = await Promise.allSettled([new Promise((resolve) => resolve(realCallback(...eventParams))), callbacks.map(callback => new Promise((resolve, reject) => {
            resolve(callback(eventId, eventParams));
        }))]);
        const mainResult = results[0];
        if (mainResult.status !== "fulfilled") throw mainResult.reason;
        else return mainResult.value as TT;
    }

    private generateEventId(): EventId {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}


// Example

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
