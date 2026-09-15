/**
 * ItemCardPrototype.js
 *
 * Stamps out the cards inside an open list, one per item. Each card shows the
 * item's description, both dates, a priority pill and a completed tick, plus
 * duplicate and delete buttons on the right.
 *
 * These cards are draggable, and each is stamped with the index it currently
 * occupies, which is what the drag and drop code in ListView works from.
 */
import { CardPrototype } from './CardPrototype.js';
import { DateUtil } from '../../common/DateUtil.js';
import { Priority } from '../../common/Priority.js';

export class ItemCardPrototype extends CardPrototype {
    /** the id of this card's <template> in index.html */
    static TEMPLATE_ID = 'item-card-template';

    /**
     * Note firstElementChild rather than firstChild: indenting the markup nicely
     * leaves a text node in front of the card. Called once, so a missing template
     * would fail immediately and obviously.
     *
     * @return {HTMLElement} a blank item card, cloned out of index.html
     */
    buildPrototypeElement() {
        const template = document.getElementById(ItemCardPrototype.TEMPLATE_ID);
        return template.content.firstElementChild.cloneNode(true);
    }

    /**
     * Pours one item's data into a fresh copy of the blank card.
     *
     * @param {HTMLElement} element a fresh clone of the blank card
     * @param {ListItem} item the item this card stands for
     * @param {number} index where that item currently sits in the list
     */
    initializeClone(element, item, index) {
        const priorityClass = Priority.cssClass(item.priority);
        const isCompleted = typeof item.isCompleted === 'function'
            ? item.isCompleted()
            : item.completed === true;

        element.dataset.itemId = item.id;
        element.dataset.index = String(index);
        element.classList.remove('priority-high', 'priority-medium', 'priority-low', 'item-completed');
        element.classList.add(priorityClass);
        element.classList.toggle('item-completed', isCompleted);

        const description = item.description ?? '';
        element.setAttribute('aria-label', isCompleted
            ? `${description} (completed)`
            : `Edit ${description}`);

        CardPrototype.requirePart(element, '.item-description').textContent = description;
        CardPrototype.requirePart(element, '.item-date-entered').textContent =
            DateUtil.format(item.dateEntered);
        CardPrototype.requirePart(element, '.item-target-date').textContent =
            DateUtil.format(item.targetDate);

        const pill = CardPrototype.requirePart(element, '.priority-pill');
        pill.textContent = Priority.clean(item.priority);
        pill.classList.remove('priority-high', 'priority-medium', 'priority-low');
        pill.classList.add(priorityClass);

        CardPrototype.requirePart(element, '.item-completed-mark').textContent =
            isCompleted ? '✓' : '';

        const duplicateButton = CardPrototype.requirePart(element, '[data-action="duplicate-item"]');
        duplicateButton.title = `Duplicate ${description}`;
        duplicateButton.setAttribute('aria-label', `Duplicate ${description}`);

        const deleteButton = CardPrototype.requirePart(element, '[data-action="delete-item"]');
        deleteButton.title = `Delete ${description}`;
        deleteButton.setAttribute('aria-label', `Delete ${description}`);
    }
}
