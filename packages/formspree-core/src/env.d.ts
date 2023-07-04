// declare PhantomJS properties that we check in session webdriver.
declare interface Window {
  _phantom?: unknown;
  callPhantom?: unknown;
}
