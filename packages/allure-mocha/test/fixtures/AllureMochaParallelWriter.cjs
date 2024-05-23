/* eslint @typescript-eslint/no-require-imports: 0 */
/* eslint @typescript-eslint/no-var-requires: 0 */
/* eslint no-underscore-dangle: 0 */
const ParallelBuffered = require("mocha/lib/nodejs/reporters/parallel-buffered.js");
const { MessageAllureWriter } = require("allure-js-commons/sdk/node");

class AllureMochaParallelWriter extends MessageAllureWriter {
  constructor() {
    super();
    this.events = [];
  }

  sendData(path, type, data) {
    const event = { path, type, data: data.toString("base64") };
    this.events.push(JSON.stringify(event));
  }
}

const writer = new AllureMochaParallelWriter();

const originalDone = ParallelBuffered.prototype.done;
ParallelBuffered.prototype.done = function (failures, callback) {
  for (const event of this.events) {
    if (event.originalError) {
      // workaround the "Converting circular structure to JSON" error
      if (event.originalError.multiple) {
        event.originalError.multiple = event.originalError.multiple.filter((e) => !Object.is(e, event.originalError));
      }
    }
  }
  return originalDone.call(this, failures, (r) => {
    r.__allure__ = writer.events;
    writer.events = [];
    callback(r);
  });
};

module.exports = writer;