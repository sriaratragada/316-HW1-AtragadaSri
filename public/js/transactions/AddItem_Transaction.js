/**
 * AddItem_Transaction.js
 *
 * Adds one item to the open list at a given index.
 *
 * The controller builds the ListItem once and hands it in. This transaction
 * holds onto that same object so that every redo restores the identical item
 * with the identical id, rather than minting a lookalike.
 */
import { jsTPS_Transaction } from '../../lib/jsTPS.js';

export class AddItem_Transaction extends jsTPS_Transaction {
    #model;
    #item;
    #index;

    /**
     * @param {WolfieListsModel} model
     * @param {ListItem} item the item to add, already built
     * @param {number} index where to put it
     */
    constructor(model, item, index) {
        super();
        this.#model = model;
        this.#item = item;
        this.#index = index;
    }

    doTransaction() {
        this.#model.addItemToCurrentList(this.#item, this.#index);
    }

    undoTransaction() {
        this.#model.removeItemFromCurrentList(this.#index);
    }

    toString() {
        return `AddItem_Transaction(index ${this.#index})`;
    }
}
