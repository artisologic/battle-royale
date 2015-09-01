import THREE from 'three';
import TWEEN from 'tween.js';
import Coordinate from '../../models/Coordinate';
import Cell from './Cell';
import { TILE_SIZE } from './Tile';
import { ANIMATION_SPEED_FACTOR } from '../../constants';



export const CELL_GAP = 0.5;

/**
 * @class Board
 */
export default class Board extends THREE.Group {

	constructor (gameModel) {
		super();

		this.name = 'board';

		const BOARD_SIZE = (gameModel.boardSize * TILE_SIZE) + ((gameModel.boardSize - 1) * CELL_GAP);

		for (let y = 0; y < gameModel.boardSize; y++) {
			for (let x = 0; x < gameModel.boardSize; x++) {

				let coordinate = new Coordinate({ x, y });
				let cellObject = new Cell(gameModel, coordinate);

				let initialOffset = TILE_SIZE / 2;
				let incrementOffset = TILE_SIZE + CELL_GAP;
				let centerInBoardOffset = -BOARD_SIZE / 2;

				cellObject.translateX(initialOffset + x * incrementOffset + centerInBoardOffset);
				cellObject.translateZ(initialOffset + y * incrementOffset + centerInBoardOffset);

				this.add(cellObject);
			}
		}
	}

	takeHit (playerModel, coordinate, hit, sunk, ship) {
		let missed = !hit;
		let force = missed ? 1 : sunk ? 6 : hit ? 3 : 0;
		let tile = this.getCell(coordinate).getSide(playerModel).tile;

		if (missed) {
			tile.markAsMissed();
		}
		else if (sunk) {
			this.sinkShip(playerModel, ship);
		}
		else if (hit) {
			tile.shipPart.takeHit();
		}

		let animationCompletePromise = this.animateImpact(coordinate, force);

		return animationCompletePromise;
	}

	getCell (coordinate) {
		return this.children.filter(cellPivot => {
			return cellPivot.cell.userData.x === coordinate.x && cellPivot.cell.userData.y === coordinate.y;
		})[0];
	}

	sinkShip (playerModel, ship) {
		let shipPartCoordinates = playerModel.board.getAllShipPartCoordinates(ship);
		shipPartCoordinates.forEach(coordinate => {
			let shipPart = this.getCell(coordinate).getSide(playerModel).tile.shipPart;
			shipPart.sink();
		});
	}

	hover (time) {
		// this.rotation.y += 0.00025;

		this.children.forEach(cellPivot => {
			let { x, y } = cellPivot.cell.userData;
			cellPivot.position.y = Math.sin(time / 1000 + (x + y) / 5) * 0.35;
		});
	}

	showSide (playerModel) {
		let promise = new Promise(resolve => {
			let cells = this.children.map(cellPivot => cellPivot.cell);
			let isHuman = playerModel.type === 'human';
			let angle = isHuman ? Math.PI : -Math.PI;

			cells.forEach((cell, index) => animateCell(cells, cell, index, isHuman, angle, resolve));
		});

		return promise;


		function animateCell (cells, cell, index, isHuman, angle, resolve) {
			let { x, y } = cell.userData;
			let size = Math.sqrt(cells.length);
			let circularDistance = Math.sqrt( Math.pow( isHuman ? x : size - x, 2) + Math.pow( isHuman ? y : size - y, 2) );

			let tween = new TWEEN.Tween(cell.rotation)
				.to({ x: String(angle) }, 2000 / ANIMATION_SPEED_FACTOR)
				.delay(circularDistance * 20 / ANIMATION_SPEED_FACTOR)
				.easing(TWEEN.Easing.Elastic.Out)
				.start();

			if (index === (isHuman ? cells.length - 1 : 0)) {
				tween.onComplete(() => resolve());
			}
		}
	}

	animateImpact (impactCoordinate, force) {
		let promise = new Promise(resolve => {
			let cells = this.children.map(cellPivot => cellPivot.cell);
			cells.forEach((cell, index) => animateCell(cell, index, cells, resolve));
		});

		return promise;


		function animateCell (cell, index, cells, resolve) {
			let { x: xP, y: yP } = impactCoordinate;
			let { x, y } = cell.userData;
			let circularDistanceFromImpact = Math.sqrt( Math.pow(xP - x, 2) + Math.pow(yP - y, 2) );

			let { x: rotX, z: rotZ } = cell.rotation;
			let props = { posY: 0, rotX, rotZ };

			let tween = new TWEEN.Tween(props)
				.to({
					posY: [ cell.position.y, (10 - circularDistanceFromImpact) * -0.1 * force, cell.position.y ],
					rotX: [ rotX, rotX + THREE.Math.degToRad((yP - y) * 2 * force), rotX ],
					rotZ: [ rotZ, rotZ + THREE.Math.degToRad((xP - x) * 2 * force), rotZ ]
				}, 2000 / ANIMATION_SPEED_FACTOR)
				.delay(circularDistanceFromImpact * 20 / ANIMATION_SPEED_FACTOR)
				.easing(TWEEN.Easing.Elastic.Out)
				.onUpdate(() => {
					cell.position.y = props.posY;
					cell.rotation.x = props.rotX;
					cell.rotation.z = props.rotZ;
				})
				.start();

			if (index === cells.length - 1) {
				tween.onComplete(() => resolve());
			}
		}
	}

}