import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    if (this.state.hasError) {
      return <div id="error">{this.state.errorMessage}</div>;
    }

    return this.props.children;
  }
}
