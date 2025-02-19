import ping from './ping.js';
import quote from './quote.js';
import apConnect from './apConnect.js';
import apDisconnect from './apDisconnect.js';
import { CommandObject } from '../../../types.js';

export const commandsList: CommandObject[] = [
    ping,
    quote,
    apConnect,
    apDisconnect
];
