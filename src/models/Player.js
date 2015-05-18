import Model from '../lib/Model';
import Board, { DEFAULT_BOARD_SIZE } from './Board';
import Ship from './Ship';
import Coordinate from './Coordinate';
import { getRandomBoolean } from '../lib/helpers';
import { EVENT_SHOT } from '../constants';


/**
 * @class Player
 */
export default class Player extends Model {

	constructor (attributes) {
		super(Object.assign({
			name: 'Default Player Name',
			boardSize: DEFAULT_BOARD_SIZE,
			board: new Board({ size: DEFAULT_BOARD_SIZE }),
			fleet: [
				new Ship({ name: 'Aircraft Carrier', size: 5 }),
				new Ship({ name: 'Battleship', size: 4 }),
				new Ship({ name: 'Destroyer', size: 3 }),
				new Ship({ name: 'Submarine', size: 3 }),
				new Ship({ name: 'Patrol Boat', size: 2 })
			],
			activated: false
		}, attributes));

		this.deployFleet();

		// proxy `EVENT_SHOT` events from board
		this.board.on(EVENT_SHOT, this.proxy.bind(this));
	}

	deployFleet () {
		this.fleet.forEach(this.deployShip.bind(this));
	}

	deployShip (ship) {
		let isDeployed = false;
		let startCoordinate = null;
		let direction = null;

		do {

			startCoordinate = Coordinate.random(this.boardSize);
			direction = getRandomBoolean() ? 'x' : 'y';
			isDeployed = this.board.deployShip(ship, startCoordinate, direction);

		} while(isDeployed === false);
	}

	isSunk () {
		return this.fleet.every(ship => ship.isSunk());
	}

	takeHit (coordinate) {
		if (this.activated) { return; }
		return this.board.takeHit(coordinate);
	}

}