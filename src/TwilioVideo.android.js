/**
 * Component to orchestrate the Twilio Video connection and the various video
 * views.
 *
 * Authors:
 *   Ralph Pina <slycoder@gmail.com>
 *   Jonathan Chang <slycoder@gmail.com>
 */

import {
  Platform,
  UIManager,
  View,
  findNodeHandle,
  requireNativeComponent,
} from "react-native";
import React, { forwardRef, useImperativeHandle } from "react";

import PropTypes from "prop-types";

const propTypes = {
  ...View.propTypes,
  /**
   * Callback that is called when camera source changes
   */
  onCameraSwitched: PropTypes.func,

  /**
   * Callback that is called when video is toggled.
   */
  onVideoChanged: PropTypes.func,

  /**
   * Callback that is called when a audio is toggled.
   */
  onAudioChanged: PropTypes.func,

  /**
   * Callback that is called when user is connected to a room.
   */
  onRoomDidConnect: PropTypes.func,

  /**
   * Callback that is called when connecting to room fails.
   */
  onRoomDidFailToConnect: PropTypes.func,

  /**
   * Callback that is called when user is disconnected from room.
   */
  onRoomDidDisconnect: PropTypes.func,

  /**
   * Called when a new data track has been added
   *
   * @param {{participant, track}}
   */
  onParticipantAddedDataTrack: PropTypes.func,

  /**
   * Called when a data track has been removed
   *
   * @param {{participant, track}}
   */
  onParticipantRemovedDataTrack: PropTypes.func,

  /**
   * Called when an dataTrack receives a message
   *
   * @param {{message}}
   */
  onDataTrackMessageReceived: PropTypes.func,

  /**
   * Called when a new video track has been added
   *
   * @param {{participant, track, enabled}}
   */
  onParticipantAddedVideoTrack: PropTypes.func,

  /**
   * Called when a video track has been removed
   *
   * @param {{participant, track}}
   */
  onParticipantRemovedVideoTrack: PropTypes.func,

  /**
   * Called when a new audio track has been added
   *
   * @param {{participant, track}}
   */
  onParticipantAddedAudioTrack: PropTypes.func,

  /**
   * Called when a audio track has been removed
   *
   * @param {{participant, track}}
   */
  onParticipantRemovedAudioTrack: PropTypes.func,

  /**
   * Callback called a participant enters a room.
   */
  onRoomParticipantDidConnect: PropTypes.func,

  /**
   * Callback that is called when a participant exits a room.
   */
  onRoomParticipantDidDisconnect: PropTypes.func,
  /**
   * Called when a video track has been enabled.
   *
   * @param {{participant, track}}
   */
  onParticipantEnabledVideoTrack: PropTypes.func,
  /**
   * Called when a video track has been disabled.
   *
   * @param {{participant, track}}
   */
  onParticipantDisabledVideoTrack: PropTypes.func,
  /**
   * Called when an audio track has been enabled.
   *
   * @param {{participant, track}}
   */
  onParticipantEnabledAudioTrack: PropTypes.func,
  /**
   * Called when an audio track has been disabled.
   *
   * @param {{participant, track}}
   */
  onParticipantDisabledAudioTrack: PropTypes.func,
  /**
   * Callback that is called when stats are received (after calling getStats)
   */
  onStatsReceived: PropTypes.func,
  /**
   * Callback that is called when network quality levels are changed (only if enableNetworkQualityReporting in connect is set to true)
   */
  onNetworkQualityLevelsChanged: PropTypes.func,
  /**
   * Called when dominant speaker changes
   * @param {{ participant, room }} dominant participant and room
   */
  onDominantSpeakerDidChange: PropTypes.func,
  /**
   * Callback that is called after determining what codecs are supported
   */
  onLocalParticipantSupportedCodecs: PropTypes.func,
};

const nativeEvents = {
  connectToRoom: 1,
  disconnect: 2,
  switchCamera: 3,
  toggleVideo: 4,
  toggleSound: 5,
  getStats: 6,
  disableOpenSLES: 7,
  toggleSoundSetup: 8,
  toggleRemoteSound: 9,
  releaseResource: 10,
  toggleBluetoothHeadset: 11,
  sendString: 12,
  publishVideo: 13,
  publishAudio: 14,
  setRemoteAudioPlayback: 15,
};

const CustomTwilioVideoView = forwardRef((props, ref) => {
  const videoViewRef = React.useRef(null);

  useImperativeHandle(ref, () => ({
    connect({
      roomName,
      accessToken,
      cameraType = "front",
      enableAudio = true,
      enableVideo = true,
      enableRemoteAudio = true,
      enableNetworkQualityReporting = false,
      dominantSpeakerEnabled = false,
      maintainVideoTrackInBackground = false,
      encodingParameters = {},
    }) {
      runCommand(nativeEvents.connectToRoom, [
        roomName,
        accessToken,
        enableAudio,
        enableVideo,
        enableRemoteAudio,
        enableNetworkQualityReporting,
        dominantSpeakerEnabled,
        maintainVideoTrackInBackground,
        cameraType,
        encodingParameters,
      ]);
    },

    sendString(message) {
      runCommand(nativeEvents.sendString, [message]);
    },

    publishLocalAudio() {
      runCommand(nativeEvents.publishAudio, [true]);
    },

    publishLocalVideo() {
      runCommand(nativeEvents.publishVideo, [true]);
    },

    unpublishLocalAudio() {
      runCommand(nativeEvents.publishAudio, [false]);
    },

    unpublishLocalVideo() {
      runCommand(nativeEvents.publishVideo, [false]);
    },

    disconnect() {
      runCommand(nativeEvents.disconnect, []);
    },

    flipCamera() {
      runCommand(nativeEvents.switchCamera, []);
    },

    setLocalVideoEnabled(enabled) {
      runCommand(nativeEvents.toggleVideo, [enabled]);
      return Promise.resolve(enabled);
    },

    setLocalAudioEnabled(enabled) {
      runCommand(nativeEvents.toggleSound, [enabled]);
      return Promise.resolve(enabled);
    },

    setRemoteAudioEnabled(enabled) {
      runCommand(nativeEvents.toggleRemoteSound, [enabled]);
      return Promise.resolve(enabled);
    },

    setBluetoothHeadsetConnected(enabled) {
      runCommand(nativeEvents.toggleBluetoothHeadset, [enabled]);
      return Promise.resolve(enabled);
    },

    setRemoteAudioPlayback({ participantSid, enabled }) {
      runCommand(nativeEvents.setRemoteAudioPlayback, [
        participantSid,
        enabled,
      ]);
    },

    getStats() {
      runCommand(nativeEvents.getStats, []);
    },

    disableOpenSLES() {
      runCommand(nativeEvents.disableOpenSLES, []);
    },

    toggleSoundSetup(speaker) {
      runCommand(nativeEvents.toggleSoundSetup, [speaker]);
    },
  }));

  const runCommand = (event, args) => {
    switch (Platform.OS) {
      case "android":
        UIManager.dispatchViewManagerCommand(
          findNodeHandle(videoViewRef.current),
          event,
          args
        );
        break;
      default:
        break;
    }
  };

  const buildNativeEventWrappers = () => {
    return [
      "onCameraSwitched",
      "onVideoChanged",
      "onAudioChanged",
      "onRoomDidConnect",
      "onRoomDidFailToConnect",
      "onRoomDidDisconnect",
      "onParticipantAddedDataTrack",
      "onParticipantRemovedDataTrack",
      "onDataTrackMessageReceived",
      "onParticipantAddedVideoTrack",
      "onParticipantRemovedVideoTrack",
      "onParticipantAddedAudioTrack",
      "onParticipantRemovedAudioTrack",
      "onRoomParticipantDidConnect",
      "onRoomParticipantDidDisconnect",
      "onParticipantEnabledVideoTrack",
      "onParticipantDisabledVideoTrack",
      "onParticipantEnabledAudioTrack",
      "onParticipantDisabledAudioTrack",
      "onStatsReceived",
      "onNetworkQualityLevelsChanged",
      "onDominantSpeakerDidChange",
      "onLocalParticipantSupportedCodecs",
    ].reduce((wrappedEvents, eventName) => {
      if (props[eventName]) {
        return {
          ...wrappedEvents,
          [eventName]: (data) => props[eventName](data.nativeEvent),
        };
      }
      return wrappedEvents;
    }, {});
  };

  React.useEffect(() => {
    return () => {
      runCommand(nativeEvents.releaseResource, []);
    };
  }, []);

  return (
    <NativeCustomTwilioVideoView
      ref={videoViewRef}
      {...props}
      {...buildNativeEventWrappers()}
    />
  );
});

CustomTwilioVideoView.propTypes = propTypes;
CustomTwilioVideoView.displayName = 'CustomTwilioVideoView';

const NativeCustomTwilioVideoView = requireNativeComponent(
  "RNCustomTwilioVideoView",
  CustomTwilioVideoView
);

module.exports = CustomTwilioVideoView;
