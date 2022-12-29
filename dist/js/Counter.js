export default class Counter {
  constructor() {
    this._value = 1;
  }

  getValue() {
    return this._value;
  }

  incrementValue() {
    return (this._value += 1); 
  }
}
