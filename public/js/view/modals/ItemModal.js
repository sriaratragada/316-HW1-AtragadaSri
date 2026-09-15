/**
 * ItemModal.js
 *
 * The modal that pops up on top of a list for viewing and editing one item, or
 * for creating a new one. It carries a labelled control for each of an item's
 * fields, Previous and Next for walking the list without closing the box, and
 * OK and Cancel.
 *
 * This modal changes nothing. It reads an item's values in, hands the values the
 * user typed back out as an ITEM_MODAL_COMMIT event, and lets the controller
 * decide whether that becomes an add, an edit, or nothing at all because the
 * user changed their mind.
 *
 * Previous and Next commit first and then move, which is what makes them useful:
 * a user can open the first item, fix a typo, press Next, fix the next one, and
 * every one of those fixes lands on the undo stack as its own transaction.
 */
import { Modal } from './Modal.js';
import { EventTypes } from '../../common/EventTypes.js';
import { DateUtil } from '../../common/DateUtil.js';
import { Priority } from '../../common/Priority.js';

export class ItemModal extends Modal {
    static MODE_CREATE = 'create';
    static MODE_EDIT = 'edit';
    static TEMPLATE_ID = 'priority-option-template';

    #heading;
    #form;
    #descriptionInput;
    #dateEnteredInput;
    #prioritySelect;
    #targetDateInput;
    #completedCheckbox;
    #previousButton;
    #nextButton;
    #cancelButton;
    #okButton;

    // which item the modal is currently being used for
    #mode;
    #index;
    #itemCount;

    constructor() {
        super('item-modal');

        this.#heading = document.getElementById('item-modal-heading');
        this.#form = document.getElementById('item-modal-form');
        this.#descriptionInput = document.getElementById('item-description-input');
        this.#dateEnteredInput = document.getElementById('item-date-entered-input');
        this.#prioritySelect = document.getElementById('item-priority-select');
        this.#targetDateInput = document.getElementById('item-target-date-input');
        this.#completedCheckbox = document.getElementById('item-completed-checkbox');
        this.#previousButton = document.getElementById('item-previous-button');
        this.#nextButton = document.getElementById('item-next-button');
        this.#cancelButton = document.getElementById('item-cancel-button');
        this.#okButton = document.getElementById('item-ok-button');

        this.#mode = ItemModal.MODE_EDIT;
        this.#index = -1;
        this.#itemCount = 0;

        this.#populatePriorityOptions();
        this.#wireEventHandlers();
    }

    // -------------------------------------------------------------------------
    // opening
    // -------------------------------------------------------------------------

    /**
     * Opens the modal on one existing item.
     *
     * @param {WolfieList} list the list that item belongs to
     * @param {number} index which item
     */
    openForItem(list, index) {
        const item = list?.getItemAt(index);
        if (!item) return;

        this.#mode = ItemModal.MODE_EDIT;
        this.#index = index;
        this.#itemCount = list.size();

        this.#heading.textContent = `Item ${index + 1} of ${list.size()}`;
        this.#okButton.textContent = 'OK';
        this.#loadValues(item.getValues());
        this.#updateNavigationButtons();
        this.show();
    }

    /**
     * Opens the modal ready to create a brand new item.
     */
    openForNewItem() {
        this.#mode = ItemModal.MODE_CREATE;
        this.#index = -1;
        this.#itemCount = 0;

        this.#heading.textContent = 'New Item';
        this.#okButton.textContent = 'Add';
        this.#loadValues({
            description: '',
            dateEntered: DateUtil.today(),
            priority: Priority.DEFAULT,
            targetDate: null,
            completed: false
        });
        this.#updateNavigationButtons();
        this.show();
    }

    /**
     * The description is the field the user actually came here to type in, so
     * that is where focus belongs, not on whatever control happens to come first.
     */
    focusFirstControl() {
        this.#descriptionInput.focus();
        this.#descriptionInput.select();
    }

    /**
     * Escape means cancel, exactly like the Cancel button.
     */
    requestCancel() {
        this.notifyObservers(EventTypes.ITEM_MODAL_CANCELLED, { mode: this.#mode });
        this.hide();
    }

    // -------------------------------------------------------------------------
    // wiring
    // -------------------------------------------------------------------------

    #wireEventHandlers() {
        this.#okButton.addEventListener('click', () => this.#commit('close'));
        this.#cancelButton.addEventListener('click', () => this.requestCancel());
        this.#previousButton.addEventListener('click', () => this.#commit('previous'));
        this.#nextButton.addEventListener('click', () => this.#commit('next'));

        // pressing Enter anywhere in the form is the same as pressing OK.
        // preventDefault also stops the browser from submitting the form itself.
        this.#form.addEventListener('keydown', (domEvent) => {
            if (domEvent.key !== 'Enter') return;
            domEvent.preventDefault();
            this.#commit('close');
        });
        this.#form.addEventListener('submit', (domEvent) => domEvent.preventDefault());
    }

    /**
     * Rebuilds the dropdown from the shared vocabulary, rather than adding to
     * whatever happens to already be in the markup. A second ItemModal sharing
     * the same select must not double the options.
     */
    #populatePriorityOptions() {
        const template = document.getElementById(ItemModal.TEMPLATE_ID);
        this.#prioritySelect.replaceChildren();
        for (const value of Priority.values()) {
            const option = template.content.firstElementChild.cloneNode(true);
            option.value = value;
            option.textContent = value;
            this.#prioritySelect.appendChild(option);
        }
    }

    // -------------------------------------------------------------------------
    // reading and writing the controls
    // -------------------------------------------------------------------------

    /**
     * @param {Object} values description, dateEntered, priority, targetDate, completed
     */
    #loadValues(values) {
        this.#descriptionInput.value = values.description ?? '';
        this.#dateEnteredInput.value = values.dateEntered ?? DateUtil.today();
        this.#prioritySelect.value = Priority.clean(values.priority);
        this.#targetDateInput.value = values.targetDate ?? '';
        this.#completedCheckbox.checked = values.completed === true;
    }

    /**
     * @return {Object} whatever the user has typed, cleaned up
     */
    #collectValues() {
        return {
            description: this.#descriptionInput.value.trim(),
            dateEntered: this.#dateEnteredInput.value || DateUtil.today(),
            priority: Priority.clean(this.#prioritySelect.value),
            targetDate: DateUtil.clean(this.#targetDateInput.value),
            completed: this.#completedCheckbox.checked
        };
    }

    /**
     * Previous and Next mean nothing for a brand new item, Previous is
     * meaningless on the first item, and Next is meaningless on the last.
     */
    #updateNavigationButtons() {
        const isCreate = this.#mode === ItemModal.MODE_CREATE;
        this.#previousButton.disabled = isCreate || this.#index <= 0;
        this.#nextButton.disabled = isCreate || this.#index >= this.#itemCount - 1;
    }

    /**
     * Validates, then announces what the user wants done.
     *
     * @param {string} then what to do afterwards, one of close, next, previous
     */
    #commit(then) {
        const values = this.#collectValues();

        if (values.description === '') {
            this.notifyObservers(EventTypes.ITEM_MODAL_INVALID, {
                title: 'A Description Is Required',
                message: 'Every item needs a description.'
            });
            return;
        }

        this.notifyObservers(EventTypes.ITEM_MODAL_COMMIT, {
            mode: this.#mode,
            index: this.#index,
            values,
            then
        });
    }
}
