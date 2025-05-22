import coreferee, spacy
nlp = spacy.load('en_core_web_trf')
nlp.add_pipe('coreferee')
doc = nlp('''

My father was a fox farmer. That is, he raised silver foxes, in pens; and in the fall and early winter, when their fur was prime, he killed them and skinned them and sold their pelts to the Hudson's Bay Company or the Montreal Fur Traders. These companies supplied us with heroic calendars to hang, one on each side of the kitchen door. Against a background of cold blue sky and black pine forests and treacherous northern rivers, plumed adventures planted the flags of England and or of France; magnificent savages bent their backs to the portage.

For several weeks before Christmas, my father worked after supper in the cellar of our house. The cellar was whitewashed, and lit by a hundred-watt bulb over the worktable. My brother Laird and I sat on the top step and watched. My father removed the pelt inside-out from the body of the fox, which looked surprisingly small, mean, and rat-like, deprived of its arrogant weight of fur. The naked, slippery bodies were collected in a sack and buried in the dump. One time the hired man, Henry Bailey, had taken a swipe at me with this sack, saying, "Christmas present!" My mother thought that was not funny. In fact she disliked the whole pelting operation--that was what the killing, skinning, and preparation of the furs was called – and wished it did not have to take place in the house. There was the smell. After the pelt had been stretched inside-out on a long board my father scraped away delicately, removing the little clotted webs of blood vessels, the bubbles of fat; the smell of blood and animal fat, with the strong primitive odour of the fox itself, penetrated all parts of the house. I found it reassuringly seasonal, like the smell of oranges and pine needles.

''')
doc._.coref_chains.print()
# Output:
#
# 0: he(1), his(6), Peter(9), He(16), his(18)
# 1: work(7), it(14)
# 2: [He(16); wife(19)], they(21), They(26), they(31)
# 3: Spain(29), country(34)
#
print(doc._.coref_chains.resolve(doc[31]))
# Output:
#
# [Peter, wife]
