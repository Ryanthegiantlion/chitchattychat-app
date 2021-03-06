import { combineReducers } from 'redux'
import * as actions from './actions'

function ui(state = {currentRoute: 'loading', chatUI: {isMenuVisible: false, selectedChannel: {type: 'Group', chatId: 0, userId: null, name: 'General' }}}, action) {
	switch (action.type) {
		case actions.CHANGE_ROUTE:
			return Object.assign({}, state, { currentRoute: action.route })
		case actions.SET_CHANNEL_MENU_VISIBLITY:
			return Object.assign(
				{}, 
				state, 
				{ chatUI: { isMenuVisible: action.isMenuVisible, selectedChannel: state.chatUI.selectedChannel}})
		case actions.SELECT_CHANNEL:
			return Object.assign(
				{}, 
				state, 
				{ chatUI: { isMenuVisible: false, selectedChannel: {
					type: 'Group',
					chatId: action.chatId,
					userId: null,
					name: action.name
				}}})
		case actions.SELECT_USER:
			return Object.assign(
				{}, 
				state, 
				{ chatUI: { isMenuVisible: false, selectedChannel: {
					type: 'DirectMessage',
					chatId: action.chatId,
					userId: action.userId,
					name: action.name
				}}})
		default:
			return state
	}
}

function session(state = {userId: null, username: null, isLoggedIn: null, pushToken: null}, action) {
	switch (action.type) {
		case actions.LOGIN: 
			return Object.assign({}, state, 
			{ 
				userId: action.userId,
				username: action.username,
				isLoggedIn: true,
				lastMessageTimestamp: null,
				pushToken: state.pushToken
			})
		case actions.UPDATE_LAST_READ_TIMESTAMP:
			return Object.assign({}, state, 
			{ 
				userId: state.userId,
				username: state.username,
				isLoggedIn: state.isLoggedIn,
				lastMessageTimestamp: state.lastMessageTimestamp && (state.lastMessageTimestamp > action.timestamp) ?
					state.lastMessageTimestamp : action.timestamp,
				pushToken: state.pushToken
			})
		case actions.ADD_SESSION:
			return Object.assign({}, state, 
			{ 
				userId: action.userId,
				username: action.username,
				isLoggedIn: action.isLoggedIn,
				lastMessageTimestamp: action.lastMessageTimestamp,
				pushToken: action.pushToken
			})
		case actions.UPDATE_PUSH_TOKEN:
			return Object.assign({}, state,
			{
				userId: state.userId,
				username: state.username,
				isLoggedIn: state.isLoggedIn,
				lastMessageTimestamp: state.lastMessageTimestamp,
				pushToken: action.pushToken
			})
		default:
			return state
	}
}

function channels(state= [{_id: 0, name: "General"}], action) {
	switch (action.type) {
		default:
			return state
	}
}

function users(state= [], action) {
	switch (action.type) {
		case actions.ADD_USERS:
			return action.users
		default:
			return state
	}
}

function messages(state= {}, action) {
	switch (action.type) {
		case actions.NEW_MESSAGE:
			var newChannelMessages = {}
			var existingMessages = state[action.message.chatId] || []

			newChannelMessages[action.message.chatId] = [
				action.message,
				...existingMessages
			]
			return Object.assign({}, state, newChannelMessages)
		case actions.ADD_MESSAGES:
			
			let newMessages = Object.assign({}, state);
			for (var key in action.messages) {
				if (key in newMessages) {
					newMessages[key] = action.messages[key].concat(newMessages[key])
				} else {
					newMessages[key] = action.messages[key]
				}
			}
			return newMessages;
		// TODO: This reduced could be cleaned up quite a bit if
		// we had one action for updating a message
		case actions.MARK_MESSAGE_AS_SENT:
			var existingMessageIndex = state[action.chatId].findIndex((message) => message.clientMessageIdentifier == action.clientMessageIdentifier);
			
			var newChatData = {}
			newChatData[action.chatId] = [
					...state[action.chatId].slice(0,existingMessageIndex),
					Object.assign({}, state[action.chatId][existingMessageIndex], {isSent: true}),
					...state[action.chatId].slice(existingMessageIndex+1)
				];
			return Object.assign({}, state, newChatData);
		case actions.MARK_MESSAGE_AS_DELIVERED:
			// TODO: surely there is a better way to do this
			// we should prob start getting better indexes on our messages
			// e.g a lookup by clientMessageIdentifier would be great
			var messageByIds = {}
			action.messages.forEach(item => {
				if (!(item.chatId in messageByIds)) {
					messageByIds[item.chatId] = {}
				}
				messageByIds[item.chatId][item.clientMessageIdentifier] = true;
			});
			var newMessages = {}
			// TODO: Putting the data in here makes this function impure
			for (key in state) {
				var currentTime = new Date();
				newMessages[key] = state[key].map((item) => Object.assign({},
					item,
					{clientEndTime: currentTime},
					{timeElapsed: item['timeElapsed'] || (currentTime - item.clientStartTime)},
					{isDelivered: item['isDelivered'] || 
					(item.chatId in messageByIds && item.clientMessageIdentifier in messageByIds[item.chatId])}
				))
			}
			return Object.assign({}, newMessages);
		default:
			return state
	}
}

function onlineIndicators(state={}, action) {
	switch (action.type) {
		case actions.UPDATE_ONLINE_USERS:
			var onlineIndicators = {}
		    action.indicators.onlineUsers.forEach(function(userId){
		      onlineIndicators[userId] = true;
		    });
		    return onlineIndicators;
		default:
			return state
	}
}

function typingIndicators(state={}, action) {
	switch (action.type) {
		case actions.UPDATE_TYPING_USERS:
			var newUserStatus = {}
			newUserStatus[action.typingStatus.senderId] = action.typingStatus.isTyping;
			return Object.assign({}, state, newUserStatus)
		default:
			return state
	}
}

function unreadIndicators(state= {}, action) {
	switch (action.type) {
		case actions.ADD_CHAT_READ_STATUS:
			return Object.assign({}, state, action.status);
		default:
			return state
	}
}

const appReducer = combineReducers({
	ui,
	session,
	channels,
	users,
	messages,
	onlineIndicators,
	unreadIndicators,
	typingIndicators
});

// TODO: Consider if the satisifes the principle of least astonishment
// Also does this follow redux principles? 
const rootReducer = (state, action) => {
  if (action.type === actions.LOGOUT) {
    state = Object.assign({}, {ui:{currentRoute: 'login', chatUI: {isMenuVisible: false, selectedChannel: {type: 'Channel', chatId: 0, userId: null, name: 'General' }}}})
  }

  return appReducer(state, action)
}

module.exports = rootReducer;