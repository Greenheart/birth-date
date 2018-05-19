// NOTE: Comments show what could be individual modules/files in a real project.
// Tested in the latest versions of Firefox, Chrome and Edge.

// ---------------------  component.js  --------------------

class Component {
    constructor (templateSelector) {
        // A temporary `DocumentFragment` used to change content before showing anything to the user.
        this.fragment = Component.fromTemplate(templateSelector)

        // The actual DOM element once it's been mounted to the DOM.
        this.ui = null
    }

    mount (mountTarget) {
        const target = document.querySelector(mountTarget)
        if (target instanceof HTMLElement) {
            target.appendChild(this.fragment)
            delete this.fragment
            this.ui = target.lastElementChild
            this.bindUI()
        }
    }

    static fromTemplate (templateSelector) {
        const template = document.querySelector(templateSelector)
        if (template instanceof HTMLElement) {
            // Return a `DocumentFragment` that has to be mounted to the DOM to become a normal Element.
            // This gives the freedom to update content, before mounting the component.
            return document.importNode(template.content, true)
        }
    }
}



// --------------------  birth-date.js  --------------------

class BirthDate extends Component {
    constructor ({ minAge, format, outputFormat, pattern, invalidCharacters, maxAge = 130 }) {
        super('#birth-date-template')
        this.minAge = minAge
        this.maxAge = maxAge
        // The expected date input format.
        this.format = format
        this.outputFormat = outputFormat
        // RegExp (in string form) used by the browser to validate the input before the date can be submitted.
        this.pattern = pattern
        // RegExp used to find and remove invalid characters from the date input.
        this.invalidCharacters = invalidCharacters
        // The parsed moment.js date set during runtime.
        this.birthDate = null
        // Used to highlight the part the user need to change to match the expected input format.
        this.invalidPart = null

        // This object holds indicies used to select different parts of the date input.
        this.selectionRange = this.getSelectionRanges(format)
        this.addContent()
    }

    addContent () {
        // Add content before the component is mounted.
        if (this.fragment) {
            const input = this.fragment.querySelector('.birth-date-input')
            // Dynamic attributes allow the date format to be customized for each component instance.
            input.title = this.format
            input.maxLength = this.format.length
            input.parentElement.dataset.placeholder = this.format
            input.pattern = this.pattern
        }
    }

    getSelectionRanges (format) {
        // Get the indices that define different parts of the date, based on the expected input format.
        // This works for any date format similar to `YYYY-MM-DD`.
        return {
            year: {
                start: format.indexOf('Y'),
                end: format.lastIndexOf('Y') + 1
            },
            month: {
                start: format.indexOf('M'),
                end: format.lastIndexOf('M') + 1
            },
            day: {
                start: format.indexOf('D'),
                end: format.lastIndexOf('D') + 1
            }
        }
    }

    bindUI () {
        this.validationMessage = this.ui.querySelector('.validation-message')
        this.input = this.ui.querySelector('.birth-date-input')

        this.input.addEventListener('input', event => this.validate())
        // Allow users to easily see the part they need to change,
        // even if the input lost focus since the last validation happened.
        this.input.addEventListener('focusin', event => this.selectInvalidPart())
        this.input.addEventListener('mouseup', event => {
            if (this.input.value.length === this.format.length && this.invalidPart) {
                // Ensure the invalidPart is highlighted when the input gains focus through a pointer event.
                // Since we want to show the user what they need to edit, we prevent the default behavior
                // that otherwise will place the cursor where the user clicked - and deselect the invalidPart.
                event.preventDefault()
            }
        })
        this.ui.addEventListener('submit', event => this.onSubmit(event))
    }

    preventInvalidInput () {
        // Prevent invalid characters from being added to the input either by keyboard or copy-pasting.
        this.input.value = this.input.value.replace(this.invalidCharacters, '')
    }

    validate () {
        this.preventInvalidInput()

        // Use exact format to ignore the UTC offset.
        // This ensures the date entered by the user is the one they see once they complete the form.
        this.birthDate = moment(this.input.value + 'T00:00:00Z', this.format + 'THH:mm:ssZ', true)

        // Assume the date is valid. Then let the checks below try to prove the opposite.
        this.invalidPart = null
        let message = ''
        this.input.classList.remove('valid', 'invalid')
        const now = moment()

        if (!this.birthDate.isValid()) {
            this.invalidPart = BirthDate.Parts[this.birthDate.invalidAt()]
            message = `This ${this.invalidPart} does not exist.`

        } else if (now.diff(this.birthDate, 'days') < 0) {
            this.invalidPart = 'year'
            message = `Seems like you're from the future. Did you just invent time travel?`

        } else if (now.diff(this.birthDate, 'years') > this.maxAge) {
            this.invalidPart = 'year'
            message = `Seems like you're quite old. Are you sure you're human?`
        }

        // Only show validation results in the UI when a date is completed.
        if (this.input.value.length === this.format.length) {
            this.input.classList.add(this.invalidPart ? 'invalid' : 'valid')
        } else {
            // Let users focus on typing by hiding the validationMessage until the date is complete.
            message = ''
        }

        this.selectInvalidPart()
        this.validationMessage.innerText = message
    }

    onSubmit (event) {
        event.preventDefault()
        this.validate()

        if (this.invalidPart) {
            this.selectInvalidPart()
        } else {
            this.checkAge()
            this.reset()
        }
    }

    checkAge () {
        const age = moment().diff(this.birthDate, 'years')
        if (age >= this.minAge) {
            alert(this.birthDate.format(this.outputFormat))
        } else {
            alert(`Sorry, you're not old enough yet.`)
        }
    }

    selectPart (part) {
        if (this.input.value.length === this.format.length) {
            // Ensure input has focus for text selection to work.
            if (document.activeElement !== this.input) {
                this.input.focus()
            }

            // Help the user see what part they need to change by selecting it for them.
            // Highlighting the invalid part gives both visual feedback and allow easy editing.
            if (this.selectionRange[part]) {
                this.input.setSelectionRange(this.selectionRange[part].start, this.selectionRange[part].end)
            }
        }
    }

    selectInvalidPart () {
        if (this.invalidPart) {
            this.selectPart(this.invalidPart)
        }
    }

    reset () {
        this.birthDate = null
        this.input.value = ''
        this.invalidPart = null
        this.validationMessage.innerText = ''
        this.input.classList.remove('valid', 'invalid')
    }
}

// Date parts as defined by Moment.js
BirthDate.Parts = {
    0: 'year',
    1: 'month',
    2: 'day'
}



// -----------------------  main.js  -----------------------

document.addEventListener('DOMContentLoaded', event => {
    const birthDate = new BirthDate({
        minAge: 18,
        format: 'YYYYMMDD',
        pattern: '\\d{8}',
        invalidCharacters: /[^\d]/g,
        outputFormat: 'YYYY-MM-DD'
    })

    birthDate.mount('#app')
    const tests = new BirthDateTests()
})










// ------------------ birth-date.test.js -------------------

// NOTE: A real project would of course use a little bit less hacky test setup than this,
// but at least it gets the job done... :)

class BirthDateTests {
    constructor () {
        this.env = jasmine.getEnv()
        document.querySelector('#run-tests').addEventListener('click', event => {
            event.target.setAttribute('disabled', 'disabled')
            event.target.title = 'Refresh the page to run again.'
            event.target.style.cursor = 'help'
            event.target.innerText = 'Running'
            this.env.execute()
        })
        this.initSuite()
    }


    initSuite () {
        const CONFIG = {
            minAge: 18,
            format: 'YYYYMMDD',
            pattern: '\\d{8}',
            invalidCharacters: /[^\d]/g,
            outputFormat: 'YYYY-MM-DD'
        }

        // Target for the bound helper.
        let addInput

        // Actual helper function.
        function _addInput (input, value) {
            input.value = value
            input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
        }

        function getSelection (input) {
            return input.value.substring(input.selectionStart, input.selectionEnd)
        }

        describe('BirthDate', function () {
            let birthDate

            beforeEach(function () {
                spyOn(BirthDate.prototype, 'checkAge').and.callThrough()
                spyOn(BirthDate.prototype, 'validate').and.callThrough()
                spyOn(BirthDate.prototype, 'selectInvalidPart').and.callThrough()
                spyOn(window, 'alert')

                birthDate = new BirthDate(CONFIG)
                birthDate.mount('#test')
                // Hack to prevent HTML5 validation messages from showing up when testing hidden components.
                // Not affecting functionality of the component itself though.
                birthDate.input.setAttribute('oninvalid', `return false`)
                // Bind default argument to helper for convenience.
                addInput = _addInput.bind(null, birthDate.input)
            })

            afterEach(function () {
                birthDate.ui.remove()
                birthDate = null
            })

            it('should instantiate successfully', function () {
                expect(birthDate instanceof BirthDate).toBe(true)
                // Test that a placeholder was properly set.
                expect(birthDate.input.parentElement.dataset.placeholder.length).toBe(birthDate.format.length)
            })

            it('should not allow blank input', function () {
                birthDate.ui.querySelector('.continue').click()
                // The browser should set the invalid pseudo class since the input is empty.
                expect(birthDate.input).toBe(birthDate.ui.querySelector(':invalid'))
                expect(birthDate.checkAge).not.toHaveBeenCalled()
            })

            it('should not show validation results before a date is completed', function () {
                addInput('2018541')

                // Validation should work even when not shown to the user.
                expect(birthDate.validate).toHaveBeenCalled()
                expect(birthDate.input).not.toHaveClass('invalid')
                expect(birthDate.invalidPart).toBe('month')
                expect(birthDate.validationMessage.innerText).toBe('')
            })

            it('should validate months properly', function () {
                addInput('20185412')

                expect(birthDate.validate).toHaveBeenCalled()
                expect(birthDate.input).toHaveClass('invalid')
                expect(birthDate.invalidPart).toBe('month')
                expect(birthDate.validationMessage.innerText).toContain('month')
            })

            it('should validate days properly', function () {
                addInput('20180399')

                expect(birthDate.validate).toHaveBeenCalled()
                expect(birthDate.input).toHaveClass('invalid')
                expect(birthDate.invalidPart).toBe('day')
                expect(birthDate.validationMessage.innerText).toContain('day')
            })

            it('should not allow future dates', function () {
                addInput('99990212')

                expect(birthDate.validate).toHaveBeenCalled()
                expect(birthDate.input).toHaveClass('invalid')
                expect(birthDate.invalidPart).toBe('year')
                expect(birthDate.validationMessage.innerText).toContain('future')
            })

            it('should not allow very old dates', function () {
                addInput('10000212')

                expect(birthDate.validate).toHaveBeenCalled()
                expect(birthDate.input).toHaveClass('invalid')
                expect(birthDate.invalidPart).toBe('year')
                expect(birthDate.validationMessage.innerText).toContain('quite old')
            })

            it('should prevent invalid input and only keep valid characters', function () {
                addInput('1aaaaaaa2')

                expect(birthDate.validate).toHaveBeenCalled()
                expect(birthDate.input.value).toBe('12')
            })

            it('should automatically select the invalidPart when input field regains focus', function () {
                addInput('20150229')

                birthDate.input.blur()
                birthDate.input.dispatchEvent(new Event('focusin', { bubbles: false, cancelable: true }))
                expect(birthDate.selectInvalidPart).toHaveBeenCalled()
                // The invalid date part, in this case the day, should be selected.
                expect(getSelection(birthDate.input)).toBe('29')

            })

            it('should visually indicate when a valid date has been entered', function () {
                addInput('19970302')
                expect(birthDate.input).toHaveClass('valid')
            })

            it('should accept valid input and show an alert with the formatted date', function () {
                addInput('19970302')
                birthDate.ui.querySelector('.continue').click()

                expect(window.alert).toHaveBeenCalledWith('1997-03-02')

                // Test that the birthDate component is reset after a sucessful entry.
                expect(birthDate.input.value).toBe('')
                expect(birthDate.input).not.toHaveClass('valid')
                expect(birthDate.input).not.toHaveClass('invalid')
            })

            it('should not allow users with age < minAge', function () {
                addInput('20150101')
                birthDate.ui.querySelector('.continue').click()

                expect(window.alert).toHaveBeenCalledWith(`Sorry, you're not old enough yet.`)
            })

            it('should not allow users with age < minAge, even if age is close to minAge', function () {
                const closeEnough = moment().subtract(CONFIG.minAge, 'year').add(1, 'day')
                addInput(closeEnough.format('YYYYMMDD'))
                birthDate.ui.querySelector('.continue').click()

                expect(window.alert).toHaveBeenCalledWith(`Sorry, you're not old enough yet.`)
            })

            it('should focus the invalidPart when user tries to submit invalid date', function () {
                addInput('15650101')
                birthDate.ui.querySelector('.continue').click()

                expect(birthDate.input.value).toBe('15650101')
                expect(birthDate.invalidPart).toBe('year')

                // The invalid date part, in this case the year, should be selected.
                expect(birthDate.selectInvalidPart).toHaveBeenCalled()
                expect(getSelection(birthDate.input)).toBe('1565')
            })
        })
    }
}
