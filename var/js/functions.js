async function loadSentences() {
    const reponse = await fetch("./phrases.txt");
    const phrasesRaw = await reponse.text();
    const phrases = phrasesRaw.split(/\r?\n/)

    var ul = document.getElementById("phrases");
    var listItemCounter = 1;

    phrases.forEach((phrase) => {
        var li = document.createElement("li");
        //li.id = 'D' + listItemCounter++;
        li.appendChild(document.createTextNode(phrase));
        ul.appendChild(li);
      });
}

function secureRand(min, max) {
	let i = rval = bits = bytes = 0;
	const range = max - min;
	if (range < 1) {
		return min;
	}
	const crypto = window.crypto || window.msCrypto;

	if (crypto && crypto.getRandomValues) {
		// Calculate Math.ceil(Math.log(range, 2)) using binary operators
		let tmp = range;
		/**
		 * mask is a binary string of 1s that we can & (binary AND) with our random
		 * value to reduce the number of lookups
		 */
		let mask = 1;
		while (tmp > 0) {
			if (bits % 8 === 0) {
				bytes++;
			}
			bits++;
			mask = mask << 1 | 1; // 0x00001111 -> 0x00011111
			tmp = tmp >>> 1;      // 0x01000000 -> 0x00100000
		}

		let values = new Uint8Array(bytes);
		let rval;
		do {
			crypto.getRandomValues(values);

			// Turn the random bytes into an integer
			rval = 0;
			for (i = 0; i < bytes; i++) {
				rval |= (values[i] << (8 * i));
			}
			// Apply the mask
			rval &= mask;
			// We discard random values outside of the range and try again
			// rather than reducing by a modulo to avoid introducing bias
			// to our random numbers.
		} while (rval > range);

		// We should return a value in the interval [min, max]
		return (rval + min);
	} else {
		// CSPRNG not available, fail closed
		throw Error('No CSPRNG available')
	}
}

function roll() {
    //Get the number of sentences : 
    const ul = document.getElementById("phrases");
    const numberMax=ul.childElementCount
    // Pick a number between 1 and Number of elements
    const number = secureRand(1, numberMax)

    document.getElementById("result").textContent = number

    const childs=Array.from(ul.children)
    childs.forEach(
        (el) => el.classList.remove('selected')
      );
    childs[number-1].classList.add('selected')
    childs[number-1].scrollIntoView();

} 