import React from 'react';
import ErrorModal from './ErrorModal';
import logger from '../utils/logger';

/**
 * React Error Boundary component that catches JavaScript errors in child components
 * and displays a fallback UI instead of crashing the entire app
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error with context
    const boundaryName = this.props.name || 'Unknown';
    logger.error('UI', `Error caught by ${boundaryName} boundary:`, error);

    // Store error info for display
    this.setState({ errorInfo });

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset error state to try rendering again
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleDismiss = () => {
    // If a dismiss handler is provided, call it
    if (this.props.onDismiss) {
      this.props.onDismiss();
    } else {
      // Otherwise just clear the error and try to continue
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise show the error modal
      return (
        <ErrorModal
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onDismiss={this.handleDismiss}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
