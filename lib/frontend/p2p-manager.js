/*global navigator*/
import Rx from 'rxjs/Rx';
import {Comunicator} from 'comunicator';
import {SignalerPeerConnection} from './p2p.js';

const comunicatorSym = Symbol('comunicator')
  , myStreamSym = Symbol('my-stream')
  , unknownPeerValue = 'unknown-peer'
  , getUserMediaConstraints = {
    'audio': true,
    'video': true
  };

class Signaler extends Rx.Observable {
  constructor(websocketUrl, getUserMediaConstr = getUserMediaConstraints) {

    const internalObservable = new Rx.Observable(subscriber => {

      this.getUserMedia = () => {

        navigator.mediaDevices.getUserMedia(this.userMediaConstraints)
          .then(localStream => {

            if (!this[myStreamSym]) {

              subscriber.next({
                'type': 'my-stream',
                'stream': localStream
              });
              this[myStreamSym] = localStream;
            }

            //TODO try to put the contextified audio
            //audioContext.createMediaStreamSource(myStream);
            //, contextifiedLocalStream = audioContext.createMediaStreamDestination();
          })
          .catch(error => {

            throw new Error(error);
          });
      };

      this[comunicatorSym].forEach(element => {

        /*{ 'opcode': 'sent', 'whoami': whoami, 'who': who, 'what': what }*/
        if (event &&
          event.detail &&
          event.detail.what &&
          event.detail.what.type) {
          var eventArrived = event.detail
          , eventType = event.detail.what.type
          , candidatesIndex
          , onAddIceCandidateSuccessBoundedToComunicatorAndChannelAndWho
          , approvedUserIndex;

          switch (eventType) {

            case 'do-handshake': {

              if (eventArrived.whoami &&
                eventArrived.what.channel) {

                initiators[eventArrived.what.channel] = eventArrived.who;
                initRTCPeerConnection(theComunicator, eventArrived.what.channel, eventArrived.whoami, true);
              } else {

                window.console.error('Missing mandatory fields: <eventArrived.whoami> and <eventArrived.what.channel>');
              }
              break;
            }

            case 'take-offer': {

              if (eventArrived.whoami &&
                eventArrived.what.channel &&
                eventArrived.what.offer) {

                if (!peerConnections[eventArrived.what.channel] ||
                  !peerConnections[eventArrived.what.channel][eventArrived.whoami]) {

                  initRTCPeerConnection(theComunicator, eventArrived.what.channel, eventArrived.whoami);
                  initiators[eventArrived.what.channel] = eventArrived.whoami;
                }
                createAnswer.call(peerConnections[eventArrived.what.channel][eventArrived.whoami],
                  theComunicator,
                  eventArrived.what.channel,
                  eventArrived.whoami,
                  eventArrived.what.offer);
              } else {

                window.console.error('Missing mandatory fields: <eventArrived.whoami>, <eventArrived.what.channel> and <eventArrived.what.offer>');
              }
              break;
            }

            case 'take-answer': {

              setRemoteDescription.call(peerConnections[eventArrived.what.channel][eventArrived.whoami],
                theComunicator,
                eventArrived.what.channel,
                eventArrived.whoami,
                eventArrived.what.answer);
              break;
            }

            case 'take-candidates': {

              if (eventArrived.what.candidates) {

                candidatesIndex = 0;
                onAddIceCandidateSuccessBoundedToComunicatorAndChannelAndWho = onAddIceCandidateSuccess.bind(peerConnections[eventArrived.what.channel][eventArrived.whoami], theComunicator, eventArrived.what.channel, eventArrived.whoami);
                for (; candidatesIndex < eventArrived.what.candidates.length; candidatesIndex += 1) {

                  peerConnections[eventArrived.what.channel][eventArrived.whoami].addIceCandidate(
                    new window.RTCIceCandidate(eventArrived.what.candidates[candidatesIndex]),
                    onAddIceCandidateSuccessBoundedToComunicatorAndChannelAndWho,
                    onAddIceCandidateError);
                }
              }
              break;
            }

            case 'initiator-quit': {

              /*eslint-disable no-use-before-define*/
              leaveChannel(theComunicator, eventArrived.what.channel, true);
              /*eslint-enable no-use-before-define*/
              break;
            }

            case 'slave-quit': {

              if (peerConnections[eventArrived.what.channel] &&
                peerConnections[eventArrived.what.channel][eventArrived.whoami]) {

                peerConnections[eventArrived.what.channel][eventArrived.whoami].close();
                delete peerConnections[eventArrived.what.channel][eventArrived.whoami];
              }

              if (dataChannels[eventArrived.what.channel] &&
                dataChannels[eventArrived.what.channel][eventArrived.whoami]) {

                dataChannels[eventArrived.what.channel][eventArrived.whoami].close();
              }

              break;
            }

            case 'approved': {

              if (eventArrived.whoami &&
                eventArrived.what.channel) {

                if (!approvedUsers[eventArrived.what.channel]) {

                  approvedUsers[eventArrived.what.channel] = [];
                }
                approvedUsers[eventArrived.what.channel].push(eventArrived.whoami);
                initRTCPeerConnection(theComunicator, eventArrived.what.channel, eventArrived.whoami, true);
              } else {

                window.console.error('Missing mandatory fields: <eventArrived.whoami> and <eventArrived.what.channel>');
              }
              break;
            }

            case 'un-approved': {

              if (eventArrived.whoami &&
                eventArrived.what.channel) {

                approvedUserIndex = approvedUsers[eventArrived.what.channel].indexOf(eventArrived.whoami);
                if (approvedUserIndex >= 0) {

                  approvedUsers[eventArrived.what.channel].splice(approvedUserIndex, 1);
                  peerConnections[eventArrived.what.channel][eventArrived.whoami].close();
                  dataChannels[eventArrived.what.channel][eventArrived.whoami].close();
                  delete peerConnections[eventArrived.what.channel][eventArrived.whoami];
                  delete dataChannels[eventArrived.what.channel][eventArrived.whoami];
                }
              } else {

                window.console.error('Missing mandatory fields: <eventArrived.whoami> and <eventArrived.what.channel>');
              }
              break;
            }

            case 'you-are-un-approved': {

              if (eventArrived.what.channel &&
                eventArrived.what.users) {

                eventArrived.what.users.forEach(function iterator(anElement) {

                  if (peerConnections[eventArrived.what.channel] &&
                    peerConnections[eventArrived.what.channel][anElement]) {

                    peerConnections[eventArrived.what.channel][anElement].removeStream(myStream);
                    peerConnections[eventArrived.what.channel][anElement].close();
                    dataChannels[eventArrived.what.channel][anElement].close();
                    delete peerConnections[eventArrived.what.channel][anElement];
                    delete dataChannels[eventArrived.what.channel][anElement];
                  }
                });
              } else {

                window.console.error('Missing mandatory field: <eventArrived.what.channel> and <eventArrived.what.users>');
              }
              break;
            }

            default: {

              window.console.error('Event valid but un-manageable. Target:', event.detail);
            }
          }
        } else {

          window.console.error('Event arrived is somehow invalid. Target:', event);
        }
      });
    }).share();

    super(observer => {

      const subscriptionToInternalObservable = internalObservable
        .subscribe(observer);

      return () => {

        subscriptionToInternalObservable.unsubscribe();
      };
    });

    this[comunicatorSym] = new Comunicator(websocketUrl);
    this.userMediaConstraints = getUserMediaConstr;
  }

  createChannel(theComunicator, channel) {

    if (!channel) {

      throw new Error('Missing mandatory <channel> parameter.');
    }

    this[comunicatorSym].sendTo(unknownPeerValue, {
      'type': 'create-channel',
      channel
    }, true);
  }

  joinChannel(theComunicator, channel) {

    if (!channel) {

      throw new Error('Missing mandatory <channel> parameter.');
    }

    this[comunicatorSym].sendTo(unknownPeerValue, {
      'type': 'join-channel',
      channel
    }, true);
  }

  streamOnChannel() {

  }

  sendTo() {

  }

  broadcast() {

  }

  approve() {

  }

  unApprove() {

  }

  leaveChannel() {

  }

  userIsPresent(whoami, token) {

    return this[comunicatorSym].userIsPresent(whoami, token);
  }

  get stream() {

    if (!this[myStreamSym]) {

      throw new Error('Stream is not present. You have to ask this to the user');
    }

    return this[myStreamSym];
  }
}

export {Signaler};