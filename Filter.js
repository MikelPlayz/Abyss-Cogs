"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Filter = void 0;
class Filter {
    static complies(words, element) {
        for (let i = 0; i < words.length; i++) {
            if (words[i].includes("|") && this.testWithPhrase(element.toLowerCase(), words[i].toLowerCase())) {
                return true;
            }
            else if (this.testWithWord(element.toLowerCase(), words[i].toLowerCase())) {
                return true;
            }
        }
        return false;
    }
    static testWithPhrase(test, word) {
        let words = word.split("|");
        for (let i = 0; i < words.length; i++) {
            if (!test.includes(words[i])) {
                return false;
            }
        }
        return true;
    }
    static testWithWord(test, word) {
        return test.includes(word);
    }
}
exports.Filter = Filter;
