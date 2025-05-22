
class EnhancedCharacterDetector {
  constructor() {
    // Initialize detection dictionaries
    this.indicators = {
      // Basic character indicators
      pronouns: ['he', 'she', 'they', 'him', 'her', 'them', 'his', 'hers', 'their', 'theirs', 'himself', 'herself', 'themselves', 'i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours', 'yourself', 'we', 'us', 'our', 'ours', 'ourselves'],
      
      // Explicit character terms (added animal-related terms)
      explicitTerms: ['character', 'person', 'man', 'woman', 'boy', 'girl', 'child', 'children', 'people', 'protagonist', 'antagonist', 'hero', 'heroine', 'villain', 'narrator', 'figure',
        // Animal character terms
        'animal', 'creature', 'beast', 'critter', 'pet'],
      
      // Animal-specific terms
      animalTerms: [
        // Common pets
        'dog', 'cat', 'bird', 'parrot', 'canary', 'hamster', 'gerbil', 'guinea pig', 'rabbit', 'turtle', 'fish', 'goldfish', 'mouse', 'rat',
        // Farm animals
        'horse', 'cow', 'pig', 'sheep', 'goat', 'chicken', 'rooster', 'duck', 'goose', 'turkey', 'donkey', 'mule', 'ox', 'bull', 'calf', 'lamb', 'piglet', 'foal', 'chick',
        // Wild animals
        'lion', 'tiger', 'bear', 'wolf', 'fox', 'deer', 'moose', 'elk', 'bison', 'buffalo', 'elephant', 'giraffe', 'monkey', 'ape', 'gorilla', 'chimpanzee', 'zebra', 'hippo', 'rhino', 'crocodile', 'alligator', 'snake', 'lizard', 'frog', 'toad', 'turtle', 'tortoise', 'eagle', 'hawk', 'owl', 'falcon', 'robin', 'sparrow', 'finch', 'cardinal', 'bluejay', 'crow', 'raven', 'magpie', 'squirrel', 'chipmunk', 'beaver', 'badger', 'raccoon', 'skunk', 'opossum', 'kangaroo', 'koala', 'panda', 'seal', 'walrus', 'penguin', 'dolphin', 'whale', 'shark', 'octopus', 'squid', 'butterfly', 'bee', 'ant', 'spider', 'scorpion',
        // Fantasy animals
        'dragon', 'unicorn', 'griffin', 'phoenix', 'centaur', 'minotaur', 'pegasus', 'kraken', 'yeti', 'sasquatch', 'bigfoot', 'werewolf'
      ],
      
      // Relationship indicators (added animal relationships)
      relationships: [
        // Family relationships
        'father', 'mother', 'dad', 'mom', 'brother', 'sister', 'son', 'daughter', 'uncle', 'aunt', 'cousin', 'grandfather', 'grandmother', 'grandpa', 'grandma', 'husband', 'wife', 'spouse', 'parent', 'child', 'sibling', 'family',
        // Social relationships
        'friend', 'enemy', 'ally', 'foe', 'colleague', 'partner', 'neighbor', 'acquaintance', 'companion', 'lover', 'ex', 'roommate', 'guest', 'host', 'client', 'customer', 'patient', 'stranger', 'visitor', 'associate',
        // Professional relationships
        'boss', 'employee', 'manager', 'supervisor', 'worker', 'staff', 'colleague', 'coworker', 'teammate', 'leader', 'follower', 'mentor', 'apprentice', 'teacher', 'student', 'professor', 'pupil', 'client', 'assistant',
        // Animal-specific relationships
        'owner', 'master', 'pet', 'companion', 'herd', 'pack', 'flock', 'pride', 'mate', 'cub', 'puppy', 'kitten', 'offspring', 'nest', 'den', 'hive', 'alpha', 'beta', 'omega', 'leader', 'predator', 'prey', 'hunter', 'keeper', 'trainer', 'rider'
      ],
      
      // Occupations and roles (added animal-specific roles)
      occupations: [
        // Professional roles
        'doctor', 'nurse', 'lawyer', 'engineer', 'scientist', 'teacher', 'professor', 'artist', 'writer', 'musician', 'actor', 'actress', 'director', 'designer', 'programmer', 'developer', 'chef', 'cook', 'waiter', 'waitress', 'barista', 'bartender', 'clerk', 'cashier', 'salesperson', 'consultant', 'analyst',
        // Animal-specific roles
        'hunter', 'gatherer', 'scavenger', 'messenger', 'guardian', 'protector', 'scout', 'lookout', 'tracker', 'leader', 'elder', 'chief', 'shaman', 'healer', 'caretaker', 'provider', 'alpha', 'defender', 'worker', 'queen', 'king', 'ruler', 'prince', 'princess', 'knight', 'ambassador', 'spy', 'messenger', 'sentry', 'guard', 'watchdog', 'guide', 'companion', 'helper', 'assistant', 'servant', 'mount', 'steed', 'beast of burden', 'performer'
      ],
      
      // Titles that often precede character names
      titles: ['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sir', 'dame', 'lady', 'lord', 'captain', 'major', 'colonel', 'general', 'admiral', 'lieutenant', 'sergeant', 'officer', 'inspector', 'detective', 'agent', 'reverend', 'bishop', 'father', 'sister', 'brother', 'elder', 'king', 'queen', 'prince', 'princess', 'duke', 'duchess', 'baron', 'baroness', 'count', 'countess', 'emperor', 'empress',
        // Animal-specific titles
        'old', 'young', 'great', 'mighty', 'brave', 'wise', 'swift', 'fierce', 'gentle'
      ],
      
      // NEW: Group/collective terms for characters
      collectiveTerms: [
        // General group terms
        'group', 'team', 'crowd', 'gang', 'band', 'party', 'crew', 'squad', 'company', 'troop', 'troupe', 'ensemble', 'cast', 'association', 'society', 'club', 'committee', 'council', 'board', 'panel', 'staff', 'congregation', 'gathering', 'assembly', 'family', 'couple', 'pair', 'trio', 'quartet', 'quintet', 'dozen', 'brigade', 'battalion', 'regiment', 'platoon', 'squadron', 'unit', 'division', 'corps', 'alliance', 'coalition', 'union', 'league', 'federation', 'posse', 'mob',
        // Animal-specific group terms
        'pack', 'herd', 'flock', 'pride', 'murder', 'school', 'pod', 'colony', 'swarm', 'hive', 'brood', 'litter', 'nest', 'gaggle', 'parliament', 'murder', 'conspiracy', 'army', 'cloud', 'clowder', 'congregation', 'drove', 'skulk', 'troop', 'fleet', 'shoal', 'team', 'sloth', 'rafter', 'flight', 'bale', 'crash', 'obstinacy', 'parade', 'leap', 'tower', 'business', 'coalition', 'caravan', 'bloat', 'clan', 'tribe', 'colony', 'rookery', 'bed', 'knot', 'bevy', 'covey', 'kettle',
        // Fantasy-specific group terms
        'fellowship', 'guild', 'clan', 'tribe', 'coven', 'order', 'circle', 'cabal', 'brotherhood', 'sisterhood', 'chapter', 'covenant', 'cult', 'sect', 'legion', 'horde', 'warband', 'host', 'cohort', 'expedition', 'quest', 'campaign'
      ],
      
      // NEW: Terms that show a transition to collective action
      collectiveActionIndicators: [
        'together', 'jointly', 'collectively', 'as one', 'in unison', 'in concert', 'in harmony', 'simultaneously', 'all at once', 'in tandem', 'joined forces', 'worked together', 'collaborated', 'cooperated', 'coordinated', 'united', 'combined', 'merged', 'gathered', 'assembled', 'convened', 'congregated', 'converged', 'rallied', 'mustered', 'mobilized', 'formed', 'organized', 'banded', 'aligned', 'allied', 'partnered', 'teamed up', 'ganged up', 'grouped together', 'came together', 'met up', 'rendezvoused', 'reunited', 'reassembled', 'rejoined', 'all of them', 'both of them', 'the group', 'the team', 'the party', 'the crew', 'the gang', 'the company', 'the band', 'the fellowship', 'the allies', 'the friends'
      ]
    };

    // Verbs and patterns for dialog and action detection
    this.verbPatterns = {
      // Speech attribution verbs (added animal sounds)
      speechVerbs: [
        'said', 'asked', 'replied', 'shouted', 'whispered', 'murmured', 'exclaimed', 'announced', 'stated', 'declared', 'questioned', 'answered', 'responded', 'called', 'cried', 'muttered', 'yelled', 'spoke', 'remarked', 'uttered', 'mentioned', 'suggested', 'added', 'continued', 'began', 'interrupted', 'interjected', 'concluded', 'repeated', 'echoed', 'sighed', 'groaned', 'mumbled', 'chuckled', 'laughed', 'gasped', 'stammered', 'stuttered',
        // Animal sound verbs
        'barked', 'meowed', 'growled', 'howled', 'roared', 'chirped', 'squawked', 'screeched', 'squeaked', 'squealed', 'grunted', 'snorted', 'bellowed', 'brayed', 'neighed', 'mooed', 'bleated', 'clucked', 'quacked', 'honked', 'hissed', 'croaked', 'hooted', 'cawed', 'trumpeted', 'whinnied', 'purred', 'woofed', 'yelped', 'whimpered', 'snarled', 'chattered', 'chittered'
      ],
      
      // Mental verbs that indicate character thoughts
      mentalVerbs: [
        'thought', 'wondered', 'realized', 'remembered', 'imagined', 'considered', 'believed', 'decided', 'knew', 'understood', 'hoped', 'feared', 'worried', 'dreamed', 'recalled', 'contemplated', 'suspected', 'doubted', 'assumed', 'speculated', 'reflected', 'concluded', 'determined', 'calculated',
        // Animal-oriented mental verbs
        'sensed', 'instinctively knew', 'felt', 'perceived'
      ],
      
      // Action verbs frequently associated with character actions (added animal-specific actions)
      actionVerbs: [
        'walked', 'ran', 'jumped', 'moved', 'stood', 'sat', 'turned', 'looked', 'watched', 'saw', 'heard', 'felt', 'touched', 'grabbed', 'took', 'put', 'placed', 'lifted', 'dropped', 'threw', 'caught', 'held', 'carried', 'pushed', 'pulled', 'opened', 'closed', 'entered', 'left', 'arrived', 'departed', 'smiled', 'frowned', 'laughed', 'cried', 'sighed', 'nodded', 'shook', 'winked', 'blinked', 'stared', 'glared', 'gazed', 'ate', 'drank', 'slept', 'woke', 'dressed', 'undressed', 'reached', 'pointed', 'waved', 'looked up',
        // Animal-specific action verbs
        'trotted', 'galloped', 'flew', 'swam', 'dove', 'soared', 'glided', 'crawled', 'slithered', 'pounced', 'leaped', 'bounded', 'hopped', 'scurried', 'prowled', 'stalked', 'chased', 'hunted', 'foraged', 'scavenged', 'nested', 'perched', 'roosted', 'grazed', 'nibbled', 'gnawed', 'scratched', 'clawed', 'pecked', 'sniffed', 'smelled', 'wagged', 'flapped', 'ruffled', 'preened', 'groomed', 'licked', 'nuzzled', 'burrowed', 'dug', 'marked', 'circled', 'herded'
      ],
      
      // Emotional expression verbs (added animal expressions)
      emotionVerbs: [
        'smiled', 'frowned', 'laughed', 'cried', 'sighed', 'groaned', 'sobbed', 'grinned', 'smirked', 'grimaced', 'scowled', 'beamed', 'glowered', 'wept', 'chuckled', 'giggled', 'snorted', 'sneered', 'blushed', 'paled', 'winced', 'flinched', 'shuddered', 'trembled', 'quivered', 'shivered', 'fumed',
        // Animal emotional expressions
        'wagged', 'purred', 'bristled', 'cowered', 'whimpered', 'yipped', 'yowled', 'hunkered', 'crouched', 'arched', 'pricked', 'flattened', 'bared', 'snapped', 'snarled', 'nuzzled', 'licked', 'preened', 'ruffled', 'fluffed', 'relaxed', 'tensed', 'drooped', 'perked up', 'growled', 'whined'
      ],
      
      // NEW: Verbs that indicate collective action
      collectiveActionVerbs: [
        'gathered', 'met', 'assembled', 'convened', 'congregated', 'converged', 'united', 'joined', 'combined', 'collaborated', 'cooperated', 'coordinated', 'teamed up', 'formed', 'organized', 'banded together', 'allied', 'partnered', 'grouped', 'huddled', 'clustered', 'flocked', 'herded', 'swarmed', 'massed', 'crowded', 'rallied', 'mobilized', 'deployed', 'marched', 'advanced', 'retreated', 'charged', 'attacked', 'defended', 'protected', 'guarded', 'escorted', 'accompanied', 'traveled', 'journeyed', 'ventured', 'explored', 'searched', 'hunted', 'foraged', 'celebrated', 'mourned', 'feasted', 'rested', 'slept', 'camped', 'settled', 'decided', 'agreed', 'planned', 'strategized', 'plotted', 'discussed', 'debated', 'argued', 'negotiated', 'voted', 'elected', 'chose', 'selected', 'appointed', 'worked', 'built', 'created', 'constructed', 'engineered', 'designed', 'developed', 'invented', 'discovered', 'found', 'located', 'identified', 'recognized', 'spotted'
      ]
    };

    // Patterns for character descriptions
    this.descriptionPatterns = {
      // Physical attributes (added animal attributes)
      physicalAttributes: [
        'tall', 'short', 'thin', 'fat', 'slim', 'heavy', 'fit', 'strong', 'weak', 'handsome', 'beautiful', 'pretty', 'ugly', 'plain', 'attractive', 'young', 'old', 'elderly', 'middle-aged', 'teenage', 'adolescent', 'adult', 'senior', 'blonde', 'brunette', 'redhead', 'gray-haired', 'bald', 'bearded', 'clean-shaven',
        // Animal physical attributes
        'furry', 'fluffy', 'fuzzy', 'hairy', 'feathered', 'scaly', 'sleek', 'shaggy', 'spotted', 'striped', 'speckled', 'mottled', 'dappled', 'black', 'white', 'brown', 'red', 'gray', 'golden', 'silver', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'tan', 'cream', 'chestnut', 'roan', 'bay', 'large', 'small', 'tiny', 'giant', 'enormous', 'massive', 'miniature', 'stocky', 'lanky', 'lean', 'plump', 'stout', 'slender', 'long-legged', 'short-legged', 'long-tailed', 'bushy-tailed', 'bob-tailed', 'stub-tailed', 'long-eared', 'floppy-eared', 'pointed-eared', 'long-necked', 'short-necked', 'broad-shouldered', 'narrow-shouldered', 'wide-eyed', 'sharp-eyed', 'keen-eyed', 'bright-eyed', 'quick', 'slow', 'agile', 'nimble', 'graceful', 'clumsy'
      ],
      
      // Personality traits (added animal personality traits)
      personalityTraits: [
        'kind', 'cruel', 'nice', 'mean', 'friendly', 'hostile', 'brave', 'cowardly', 'bold', 'timid', 'shy', 'outgoing', 'introverted', 'extroverted', 'cheerful', 'gloomy', 'optimistic', 'pessimistic', 'generous', 'greedy', 'patient', 'impatient', 'honest', 'dishonest', 'loyal', 'treacherous', 'humble', 'proud', 'arrogant', 'confident', 'insecure', 'intelligent', 'stupid', 'clever', 'witty', 'dull',
        // Animal personality traits
        'playful', 'mischievous', 'curious', 'cautious', 'alert', 'watchful', 'wary', 'suspicious', 'trusting', 'dominant', 'submissive', 'aggressive', 'gentle', 'fierce', 'wild', 'tame', 'docile', 'skittish', 'nervous', 'relaxed', 'calm', 'excitable', 'energetic', 'lazy', 'active', 'restless', 'territorial', 'protective', 'maternal', 'paternal', 'loyal', 'faithful', 'devoted', 'independent', 'stubborn', 'obedient', 'trainable', 'untamed', 'feral', 'sociable', 'solitary', 'pack-oriented', 'predatory', 'stealthy', 'cunning', 'crafty', 'sly', 'sneaky', 'instinctive'
      ]
    };

    // Regex patterns for various detection methods
    this.regexPatterns = {
      // Basic proper name detection (capitalized word not at start of sentence)
      properName: /(?:^|[.!?]\s+|\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      
      // Pattern for identifying quoted speech
      quotedSpeech: /"([^"]+)"\s*(?:,?\s*([a-z]+)\s+([A-Z][a-z]+)|([A-Z][a-z]+)\s+([a-z]+)|,?\s*([a-z]+)\s+the\s+([a-z]+))/g,
      
      // Pattern for identifying dialogue with em dashes
      emDashDialogue: /—([^—]+)—\s*(?:,?\s*([a-z]+)\s+([A-Z][a-z]+)|([A-Z][a-z]+)\s+([a-z]+)|,?\s*([a-z]+)\s+the\s+([a-z]+))/g,
      
      // Pattern for identifying dialogue with single quotes
      singleQuoteDialogue: /'([^']+)'\s*(?:,?\s*([a-z]+)\s+([A-Z][a-z]+)|([A-Z][a-z]+)\s+([a-z]+)|,?\s*([a-z]+)\s+the\s+([a-z]+))/g,
      
      // Pattern for identifying character descriptions
      characterDescription: /(?:the|a|an)\s+(?:[a-z]+\s+)*(?:[a-z]+)\s+(?:man|woman|boy|girl|person|child|figure|character|animal|creature|beast|dog|cat|bird|horse|lion|tiger|bear|wolf|fox|rabbit|mouse|rat|elephant|monkey|snake|frog|owl|eagle|hawk|fish|turtle|spider|bee|ant|fly|deer|moose|elk|cow|pig|sheep|goat|chicken|duck|goose|dragon|unicorn|griffin|phoenix)/gi,
      
      // Pattern for recognizing title+name combinations
      titleName: new RegExp("\\b(" + ['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sir', 'lady', 'lord', 'captain', 'major', 'old', 'young', 'great', 'mighty', 'brave', 'wise', 'swift', 'fierce', 'gentle'].join('|') + ")\\.?\\s+([A-Z][a-z]+)", 'gi'),
      
      // Pattern for animal-specific character detection
      animalName: /(?:^|[.!?]\s+|\s+)(?:the|a|an)\s+([a-z]+)(?:\s+named\s+([A-Z][a-z]+))?/gi,
      
      // Pattern for "the animal" constructions that might indicate characters
      theAnimal: new RegExp("\\b(the)\\s+(" + this.indicators.animalTerms.join('|') + ")\\b", 'gi'),
      
      // NEW: Pattern for detecting collective references to characters
      collectiveReference: new RegExp("\\b(the|a|an|our|their|his|her)\\s+(" + this.indicators.collectiveTerms.join('|') + ")\\b", 'gi'),
      
      // NEW: Pattern for detecting characters acting together
      charactersActingTogether: /\b([A-Z][a-z]+)(?:\s+and\s+([A-Z][a-z]+))+\b/g,
      
      // NEW: Pattern for detecting enumerated characters that might act as a group
      enumeratedCharacters: /\b([A-Z][a-z]+),\s+([A-Z][a-z]+)(?:,\s+([A-Z][a-z]+))*(?:,?\s+and\s+([A-Z][a-z]+))\b/g,
      
      // NEW: Pattern for detecting plural pronouns that might indicate collective action
      pluralPronouns: /\b(they|them|their|theirs|themselves|we|us|our|ours|ourselves)\b/gi,
      
      // NEW: Pattern for detecting collective action indicators
      collectiveActionIndicator: new RegExp("\\b(" + this.indicators.collectiveActionIndicators.join('|').replace(/\s+/g, '\\s+') + ")\\b", 'gi'),
      
      // NEW: Pattern for detecting the transition to collective identity
      collectiveIdentityFormation: /\b(?:became|formed|joined|created|established|founded|organized)\s+(?:a|the|their|their\s+own)\s+(?:group|team|alliance|partnership|coalition|union|federation|league|association|society|club|committee|council|board|family|gang|band|crew|squad|fellowship|brotherhood|sisterhood|order|guild|clan|tribe)/gi
    };

    // Cache for detected characters
    this.characterCache = new Map();
    
    // NEW: Cache for detected collective groups
    this.collectiveCache = new Map();
    
    // NEW: Track character relationships and groupings
    this.characterRelationships = new Map();
    
    // NEW: Track the narrative timeline of character interactions
    this.narrativeTimeline = [];
    
    // NEW: Tracking position in the narrative for chronological ordering
    this.currentPosition = 0;
  }
/**
 * Check if a name is a common false positive for character detection
 * @param {string} name - The name to check
 * @return {boolean} True if it's a common false positive, false otherwise
 */
isCommonFalsePositive(name) {
  // List of common words that might be capitalized but aren't character names
  const commonFalsePositives = [
    // Days and months
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 
    'September', 'October', 'November', 'December',
    
    // Common place indicators
    'North', 'South', 'East', 'West', 'Street', 'Avenue', 'Road', 'Boulevard',
    'Highway', 'Lane', 'Drive', 'Place', 'Square', 'Park', 'Bridge', 'River',
    'Lake', 'Ocean', 'Sea', 'Mountain', 'Valley', 'Forest', 'Desert', 'City',
    'Town', 'Village', 'Country', 'State', 'Island', 'Castle', 'Palace',
    
    // Common time indicators
    'Today', 'Tomorrow', 'Yesterday', 'Morning', 'Afternoon', 'Evening', 'Night',
    
    // Common abstract concepts often capitalized
    'God', 'Heaven', 'Hell', 'Earth', 'World', 'Universe', 'Time', 'Life', 'Death',
    'Love', 'Hate', 'Peace', 'War', 'Justice', 'Truth', 'Liberty', 'Freedom',
    
    // Common objects/terms that might be capitalized
    'Internet', 'Web', 'TV', 'Phone', 'Computer', 'School', 'College', 'University',
    'Hospital', 'Church', 'Home', 'House', 'Office', 'Building', 'Room', 'Door',
    'Window', 'Table', 'Chair', 'Book', 'Bible', 'Constitution', 'Government',
    
    // Languages, nationalities, and groups
    'English', 'French', 'Spanish', 'German', 'Chinese', 'Japanese', 'Russian',
    'American', 'European', 'Asian', 'African', 'Australian', 'Christian', 'Muslim',
    'Jewish', 'Buddhist', 'Hindu', 'Catholic', 'Protestant',
    
    // Short words often used at beginning of sentences
    'The', 'A', 'An', 'This', 'That', 'These', 'Those', 'It', 'If', 'But', 'And',
    'Or', 'So', 'As', 'Now', 'Then', 'When', 'Where', 'Why', 'How', 'What', 'Who',
    'Which', 'While', 'Though', 'Although', 'Because', 'Since', 'Until', 'After',
    'Before', 'During'
  ];
  
  // Check if name is in the list of common false positives
  return commonFalsePositives.includes(name);
}

/**
 * Get a list of recently active characters before this section
 * @param {object} results - The results object with all character data
 * @param {number} sectionIndex - The current section index
 * @return {string[]} Array of recently active character names
 */
getRecentActiveCharacters(results, sectionIndex) {
  // Look at previous sections only
  if (sectionIndex <= 0) return [];
  
  const recentChars = new Set();
  
  // Get mentions from the previous section
  results.mentions.forEach(mention => {
    // Get section index from position
    const mentionSectionIndex = this.getSectionIndexFromPosition(mention.position);
    // Only consider mentions from the immediately previous section
    if (mentionSectionIndex === sectionIndex - 1) {
      recentChars.add(mention.character);
    }
  });
  
  return [...recentChars];
}

/**
 * Get a list of recently active collectives before this section
 * @param {object} results - The results object with all collective data
 * @param {number} sectionIndex - The current section index
 * @return {string[]} Array of recently active collective names
 */
getRecentActiveCollectives(results, sectionIndex) {
  // Look at previous sections only
  if (sectionIndex <= 0) return [];
  
  const recentCollectives = new Set();
  
  // Get collective mentions from the previous section
  results.collectiveMentions.forEach(mention => {
    // Get section index from position
    const mentionSectionIndex = this.getSectionIndexFromPosition(mention.position);
    // Only consider mentions from the immediately previous section
    if (mentionSectionIndex === sectionIndex - 1) {
      recentCollectives.add(mention.collective);
    }
  });
  
  return [...recentCollectives];
}

/**
 * Get the section index for a given position in the text
 * @param {number} position - Position in the text
 * @return {number} Section index
 */
getSectionIndexFromPosition(position) {
  for (let i = 0; i < this.narrativeTimeline.length - 1; i++) {
    if (position >= this.narrativeTimeline[i] && position < this.narrativeTimeline[i+1]) {
      return i;
    }
  }
  return this.narrativeTimeline.length - 2; // Default to last section
}

/**
 * Helper method to get the context around a position in text
 * @param {string} text - The full text
 * @param {number} position - Position in the text
 * @param {number} windowSize - Size of context window
 * @return {string} Context snippet
 */
getContextAround(text, position, windowSize) {
  const start = Math.max(0, position - windowSize/2);
  const end = Math.min(text.length, position + windowSize/2);
  return text.substring(start, end);
}

/**
 * Get the absolute position of a character in the narrative
 * @param {number} sectionIndex - The section index
 * @return {number} Absolute position in the text
 */
getCharacterPosition(sectionIndex) {
  return this.narrativeTimeline[sectionIndex] || 0;
}

/**
 * Add a character to the results
 * @param {object} results - Results object to update
 * @param {string} name - Character name
 * @param {object} evidence - Evidence for this character
 * @param {string} confidence - Confidence level (high, medium, low)
 * @param {number} sectionIndex - Index of the section in the narrative
 */
addCharacter(results, name, evidence, confidence, sectionIndex) {
  if (!results.characters.has(name)) {
    results.characters.set(name, {
      name: name,
      evidence: [],
      type: this.determineCharacterType(name, evidence),
      firstAppearance: this.getCharacterPosition(sectionIndex)
    });
  }
  
  // Add this evidence
  results.characters.get(name).evidence.push(evidence);
  
  // Update confidence if higher
  const confidenceLevels = { 'high': 3, 'medium': 2, 'low': 1 };
  const currentConfidence = results.characters.get(name).confidence || 0;
  if (confidenceLevels[confidence] > currentConfidence) {
    results.characters.get(name).confidence = confidenceLevels[confidence];
  }
}

/**
 * Determine character type based on name and evidence
 * @param {string} name - Character name
 * @param {object} evidence - Evidence object
 * @return {string} Character type
 */
determineCharacterType(name, evidence) {
  // Check if it's an animal character
  if (evidence.species || evidence.type === 'namedAnimal' || evidence.type === 'unnamedAnimal' || evidence.type === 'theAnimal') {
    return 'animal';
  }
  
  // Check common animal terms in the name
  for (const term of this.indicators.animalTerms) {
    if (name.toLowerCase().includes(term.toLowerCase())) {
      return 'animal';
    }
  }
  
  // Default to human character
  return 'human';
}

/**
 * Add a mention of a character
 * @param {object} results - Results object to update
 * @param {string} name - Character name
 * @param {object} mention - Mention data
 * @param {number} sectionIndex - Index of the section in the narrative
 */
addMention(results, name, mention, sectionIndex) {
  results.mentions.push({
    character: name,
    position: mention.position || this.getCharacterPosition(sectionIndex),
    ...mention
  });
}

/**
 * Add a relationship between entities
 * @param {object} results - Results object to update
 * @param {string} source - Source entity name
 * @param {string} target - Target entity name
 * @param {string} relation - Type of relationship
 * @param {object} context - Context information
 * @param {number} sectionIndex - Index of the section in the narrative
 */
addRelationship(results, source, target, relation, context, sectionIndex) {
  const relationId = `${source}:${relation}:${target}`;
  
  if (!results.relationships.has(relationId)) {
    results.relationships.set(relationId, {
      source: source,
      target: target,
      relation: relation,
      evidence: [],
      firstMention: this.getCharacterPosition(sectionIndex)
    });
  }
  
  // Add evidence for this relationship
  results.relationships.get(relationId).evidence.push(context);
}

/**
 * Extract attributes from character description
 * @param {string} description - The character description text
 * @return {object} Object with physical and personality attributes
 */
extractAttributes(description) {
  const attributes = {
    physical: [],
    personality: []
  };
  
  // Check for physical attributes
  for (const attr of this.descriptionPatterns.physicalAttributes) {
    if (description.toLowerCase().includes(attr.toLowerCase())) {
      attributes.physical.push(attr);
    }
  }
  
  // Check for personality traits
  for (const trait of this.descriptionPatterns.personalityTraits) {
    if (description.toLowerCase().includes(trait.toLowerCase())) {
      attributes.personality.push(trait);
    }
  }
  
  return attributes;
}

/**
 * Check if a word is capitalized
 * @param {string} word - Word to check
 * @return {boolean} True if capitalized
 */
isCapitalized(word) {
  return /^[A-Z][a-z]*$/.test(word);
}

/**
 * Add a collective to the results
 * @param {object} results - Results object to update
 * @param {string} name - Collective name
 * @param {string[]} members - Members of this collective
 * @param {object} evidence - Evidence for this collective
 * @param {string} confidence - Confidence level (high, medium, low)
 * @param {number} sectionIndex - Index of the section in the narrative
 */
addCollective(results, name, members, evidence, confidence, sectionIndex) {
  if (!results.collectives.has(name)) {
    results.collectives.set(name, {
      name: name,
      members: [...members], // Copy the array
      evidence: [],
      firstAppearance: this.getCharacterPosition(sectionIndex)
    });
  } else {
    // Add any new members
    const collective = results.collectives.get(name);
    for (const member of members) {
      if (!collective.members.includes(member)) {
        collective.members.push(member);
      }
    }
  }
  
  // Add this evidence
  results.collectives.get(name).evidence.push(evidence);
  
  // Update confidence if higher
  const confidenceLevels = { 'high': 3, 'medium': 2, 'low': 1 };
  const currentConfidence = results.collectives.get(name).confidence || 0;
  if (confidenceLevels[confidence] > currentConfidence) {
    results.collectives.get(name).confidence = confidenceLevels[confidence];
  }
}

/**
 * Add evidence to an existing collective
 * @param {object} results - Results object to update
 * @param {string} name - Collective name
 * @param {object} evidence - Evidence for this collective
 * @param {string} confidence - Confidence level (high, medium, low)
 * @param {number} sectionIndex - Index of the section in the narrative
 */
addCollectiveEvidence(results, name, evidence, confidence, sectionIndex) {
  if (results.collectives.has(name)) {
    // Add this evidence
    results.collectives.get(name).evidence.push(evidence);
    
    // Update confidence if higher
    const confidenceLevels = { 'high': 3, 'medium': 2, 'low': 1 };
    const currentConfidence = results.collectives.get(name).confidence || 0;
    if (confidenceLevels[confidence] > currentConfidence) {
      results.collectives.get(name).confidence = confidenceLevels[confidence];
    }
  }
}

/**
 * Add a mention of a collective
 * @param {object} results - Results object to update
 * @param {string} name - Collective name
 * @param {object} mention - Mention data
 * @param {number} sectionIndex - Index of the section in the narrative
 */
addCollectiveMention(results, name, mention, sectionIndex) {
  results.collectiveMentions.push({
    collective: name,
    position: mention.position || this.getCharacterPosition(sectionIndex),
    ...mention
  });
}

/**
 * Process relationships for output
 * @param {Map} relationships - Map of relationships
 * @return {Array} Array of relationship objects
 */
processRelationships(relationships) {
  return Array.from(relationships.values()).map(rel => ({
    source: rel.source,
    target: rel.target,
    relation: rel.relation,
    mentions: rel.evidence.length,
    firstMention: rel.firstMention
  }));
}
  /***
   * Main method to detect both human and animal characters in text
   * Enhanced to detect collective actions and relationships
   * @param {string} text - The text to analyze
   * @return {object} Object containing detected characters, groups, and their relationships
   */
  detectCharacters(text) {
    // Reset position counter for this analysis
    this.currentPosition = 0;
    
    // Create a results object
    const results = {
      characters: new Map(),
      collectives: new Map(),
      mentions: [],
      collectiveMentions: [],
      relationships: new Map(),
      timeline: [],
      confidence: {high: [], medium: [], low: []},
      collectiveConfidence: {high: [], medium: [], low: []}
    };
    
    // Split text into sections for chronological analysis
    const sections = this.splitIntoSections(text);
    
    // Initialize narrative timeline with section boundaries
    this.narrativeTimeline = [];
    let currentPos = 0;
    
    // Process each section to maintain narrative order
    sections.forEach((section, sectionIndex) => {
      // Track section boundaries in narrative timeline
      this.narrativeTimeline.push(currentPos);
      
      // Apply different detection methods
      this.detectProperNames(section, results, sectionIndex);
      this.detectDialogueAttributions(section, results, sectionIndex);
      this.detectTitledNames(section, results, sectionIndex);
      this.detectActionSubjects(section, results, sectionIndex);
      this.detectCharacterDescriptions(section, results, sectionIndex);
      this.detectOccupationsAndRoles(section, results, sectionIndex);
      
      // Animal character detection
      this.detectAnimalCharacters(section, results, sectionIndex);
      this.detectTheAnimalConstructions(section, results, sectionIndex);
      
      // NEW: Collective character detection
      this.detectCollectiveReferences(section, results, sectionIndex);
      this.detectCharactersActingTogether(section, results, sectionIndex);
      this.detectEnumeratedCharacters(section, results, sectionIndex);
      this.detectPluralPronouns(section, results, sectionIndex);
      this.detectCollectiveActionIndicators(section, results, sectionIndex);
      this.detectCollectiveIdentityFormation(section, results, sectionIndex);
      
      // Increment position counter for chronological ordering
      currentPos += section.length;
    });
    
    // Add final position to timeline
    this.narrativeTimeline.push(currentPos);
    
    // Process results and assign confidence levels
    this.processResults(results);
    
    // NEW: Analyze character transitions from individual to collective
    this.analyzeCharacterTransitions(results);
    
    return {
      characters: [...results.confidence.high, ...results.confidence.medium, ...results.confidence.low],
      highConfidence: results.confidence.high,
      mediumConfidence: results.confidence.medium,
      lowConfidence: results.confidence.low,
      mentions: results.mentions,
      collectives: [...results.collectiveConfidence.high, ...results.collectiveConfidence.medium, ...results.collectiveConfidence.low],
      collectiveMentions: results.collectiveMentions,
      relationships: this.processRelationships(results.relationships),
      timeline: results.timeline,
      // NEW: Analysis of character transitions
      transitions: this.identifyCharacterTransitions(results)
    };
  }

  /***
   * Split text into sections for chronological analysis
   * Uses paragraphs or sentence groupings
   */
  splitIntoSections(text) {
    // First try to split by paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    if (paragraphs.length > 1) {
      return paragraphs;
    }
    
    // If no paragraphs, try to group sentences
    // const sentences = text.split(/(?<=[.!?])\s+/);
    const sentences = text.split(/[.!?]\s+/).filter(Boolean);
    const sections = [];
    let currentSection = '';
    
    sentences.forEach((sentence, index) => {
      currentSection += sentence + '';
      // Group approximately every 3-5 sentences or at natural breaks
      // Group approximately every 3-5 sentences or at natural breaks
      if (index % 4 === 0 || index === sentences.length - 1) {
        sections.push(currentSection.trim());
        currentSection = '';
      }
    });
    
    return sections.length > 0 ? sections : [text];
  }
  /**
   * Detect proper names in text
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectProperNames(section, results, sectionIndex) {
    const properNamePattern = this.regexPatterns.properName;
    let match;
    
    // Reset regex to start from beginning
    properNamePattern.lastIndex = 0;
    
    while ((match = properNamePattern.exec(section)) !== null) {
      const name = match[1];
      
      // Skip common false positives
      if (this.isCommonFalsePositive(name)) continue;
      
      // Current position in narrative
      const position = this.getCharacterPosition(sectionIndex);
      
      // Add to character map with proper name evidence
      this.addCharacter(results, name, {
        type: 'properName',
        context: this.getContextAround(section, match.index, 100),
        position: position
      }, 'medium', sectionIndex);
      
      // Add to mentions
      this.addMention(results, name, {
        type: 'properName',
        context: this.getContextAround(section, match.index, 50),
        position: position
      }, sectionIndex);
    }
  }

  /**
   * Detect characters through dialogue attributions
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectDialogueAttributions(section, results, sectionIndex) {
    // Check for quoted speech
    this.detectDialoguePattern(section, results, this.regexPatterns.quotedSpeech, 'quotedSpeech', sectionIndex);
    
    // Check for em dash dialogue
    this.detectDialoguePattern(section, results, this.regexPatterns.emDashDialogue, 'emDashDialogue', sectionIndex);
    
    // Check for single quote dialogue
    this.detectDialoguePattern(section, results, this.regexPatterns.singleQuoteDialogue, 'singleQuoteDialogue', sectionIndex);
  }

  /**
   * Helper method to detect dialogue patterns
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {RegExp} pattern - Regex pattern to use
   * @param {string} type - Type of dialogue pattern
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectDialoguePattern(section, results, pattern, type, sectionIndex) {
    let match;
    
    // Reset regex to start from beginning
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(section)) !== null) {
      // Different patterns may have different group indices
      let characterName = null;
      let speechVerb = null;
      let dialogue = match[1];
      
      // Check different group combinations based on the pattern
      if (match[3] && this.isCapitalized(match[3])) {
        // Pattern: "dialogue", verb Name
        characterName = match[3];
        speechVerb = match[2];
      } else if (match[4] && this.isCapitalized(match[4])) {
        // Pattern: "dialogue" Name verb
        characterName = match[4];
        speechVerb = match[5];
      } else if (match[7]) {
        // Pattern: "dialogue", verb the animal
        const animalType = match[7];
        characterName = `the ${animalType}`;
        speechVerb = match[6];
      }
      
      // If we found a character with dialogue
      if (characterName) {
        const position = this.getCharacterPosition(sectionIndex);
        
        // High confidence due to dialogue attribution
        this.addCharacter(results, characterName, {
          type: 'dialogue',
          dialogue: dialogue,
          verb: speechVerb,
          context: this.getContextAround(section, match.index, 100),
          position: position
        }, 'high', sectionIndex);
        
        // Add to mentions
        this.addMention(results, characterName, {
          type: 'dialogue',
          dialogue: dialogue.substring(0, 50) + (dialogue.length > 50 ? '...' : ''),
          position: position
        }, sectionIndex);
      }
    }
  }

  /**
   * Detect characters with titles
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectTitledNames(section, results, sectionIndex) {
    const titlePattern = this.regexPatterns.titleName;
    let match;
    
    // Reset regex to start from beginning
    titlePattern.lastIndex = 0;
    
    while ((match = titlePattern.exec(section)) !== null) {
      const title = match[1];
      const name = match[2];
      const fullName = `${title} ${name}`;
      const position = this.getCharacterPosition(sectionIndex);
      
      // Add character with title information (high confidence)
      this.addCharacter(results, name, {
        type: 'titledName',
        title: title,
        fullName: fullName,
        context: this.getContextAround(section, match.index, 100),
        position: position
      }, 'high', sectionIndex);
      
      // Also add the full titled name as an alias
      this.addCharacter(results, fullName, {
        type: 'fullTitledName',
        baseCharacter: name,
        context: this.getContextAround(section, match.index, 100),
        position: position
      }, 'medium', sectionIndex);
      
      // Add relationship between title and character
      this.addRelationship(results, name, title, 'hasTitle', {
        context: this.getContextAround(section, match.index, 50),
        position: position
      }, sectionIndex);
      
      // Add to mentions
      this.addMention(results, name, {
        type: 'titledName',
        title: title,
        fullName: fullName,
        position: position
      }, sectionIndex);
    }
  }

  /**
   * Detect characters through action verbs
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectActionSubjects(section, results, sectionIndex) {
    // Get all action verbs
    const actionVerbs = [...this.verbPatterns.actionVerbs, ...this.verbPatterns.emotionVerbs, ...this.verbPatterns.mentalVerbs];
    
    // Process each verb
    for (const verb of actionVerbs) {
      // Look for patterns like "Name verbED" or "Name was verbING"
      const patterns = [
        new RegExp(`\\b([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\s+${verb}ed\\b`, 'g'),
        new RegExp(`\\b([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\s+${verb}d\\b`, 'g'),
        new RegExp(`\\b([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\s+${verb}s\\b`, 'g'),
        new RegExp(`\\b([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\s+was\\s+${verb}ing\\b`, 'g'),
        new RegExp(`\\b([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\s+is\\s+${verb}ing\\b`, 'g'),
        new RegExp(`\\b([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\s+${verb}\\b`, 'g')
      ];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(section)) !== null) {
          const name = match[1];
          
          // Skip common false positives
          if (this.isCommonFalsePositive(name)) continue;
          
          const position = this.getCharacterPosition(sectionIndex);
          
          // Add character with action evidence
          this.addCharacter(results, name, {
            type: 'action',
            verb: verb,
            action: match[0],
            context: this.getContextAround(section, match.index, 100),
            position: position
          }, 'medium', sectionIndex);
          
          // Add to mentions
          this.addMention(results, name, {
            type: 'action',
            action: match[0],
            position: position
          }, sectionIndex);
        }
      }
    }
  }

  /**
   * Detect characters through descriptions
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectCharacterDescriptions(section, results, sectionIndex) {
    const descPattern = this.regexPatterns.characterDescription;
    let match;
    
    // Reset regex to start from beginning
    descPattern.lastIndex = 0;
    
    while ((match = descPattern.exec(section)) !== null) {
      const fullMatch = match[0];
      const characterType = fullMatch.match(/(?:man|woman|boy|girl|person|child|figure|character|animal|creature|beast|dog|cat|bird|horse|lion|tiger|bear|wolf|fox|rabbit|mouse|rat|elephant|monkey|snake|frog|owl|eagle|hawk|fish|turtle|spider|bee|ant|fly|deer|moose|elk|cow|pig|sheep|goat|chicken|duck|goose|dragon|unicorn|griffin|phoenix)$/i);
      
      if (characterType) {
        const charType = characterType[0].toLowerCase();
        const description = fullMatch.substring(0, fullMatch.length - charType.length).trim();
        const characterName = description.replace(/^(?:the|a|an)\s+/, '').trim() + ' ' + charType;
        const position = this.getCharacterPosition(sectionIndex);
        
        // Extract attributes from description
        const attributes = this.extractAttributes(description);
        
        // Add character with description evidence
        this.addCharacter(results, characterName, {
          type: 'description',
          characterType: charType,
          description: description,
          attributes: attributes,
          context: this.getContextAround(section, match.index, 100),
          position: position
        }, 'medium', sectionIndex);
        
        // Add to mentions
        this.addMention(results, characterName, {
          type: 'description',
          description: description,
          position: position
        }, sectionIndex);
      }
    }
  }

  /**
   * Detect characters through occupations and roles
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectOccupationsAndRoles(section, results, sectionIndex) {
    // Check for patterns like "Name the occupation" or "the occupation named Name"
    for (const occupation of this.indicators.occupations) {
      // "Name the occupation" pattern
      const pattern1 = new RegExp(`\\b([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\s+the\\s+${occupation}\\b`, 'gi');
      let match;
      
      while ((match = pattern1.exec(section)) !== null) {
        const name = match[1];
        const position = this.getCharacterPosition(sectionIndex);
        
        // Add character with occupation evidence
        this.addCharacter(results, name, {
          type: 'occupation',
          role: occupation,
          context: this.getContextAround(section, match.index, 100),
          position: position
        }, 'high', sectionIndex);
        
        // Add relationship between character and role
        this.addRelationship(results, name, occupation, 'hasRole', {
          context: this.getContextAround(section, match.index, 50),
          position: position
        }, sectionIndex);
        
        // Add to mentions
        this.addMention(results, name, {
          type: 'occupation',
          role: occupation,
          position: position
        }, sectionIndex);
      }
      
      // "the occupation named Name" pattern
      const pattern2 = new RegExp(`\\bthe\\s+${occupation}\\s+(?:named|called)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*)\\b`, 'gi');
      
      while ((match = pattern2.exec(section)) !== null) {
        const name = match[1];
        const position = this.getCharacterPosition(sectionIndex);
        
        // Add character with occupation evidence
        this.addCharacter(results, name, {
          type: 'occupation',
          role: occupation,
          context: this.getContextAround(section, match.index, 100),
          position: position
        }, 'high', sectionIndex);
        
        // Add relationship between character and role
        this.addRelationship(results, name, occupation, 'hasRole', {
          context: this.getContextAround(section, match.index, 50),
          position: position
        }, sectionIndex);
        
        // Add to mentions
        this.addMention(results, name, {
          type: 'occupation',
          role: occupation,
          position: position
        }, sectionIndex);
      }
    }
  }

  /**
   * Detect animal characters
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectAnimalCharacters(section, results, sectionIndex) {
    const animalPattern = this.regexPatterns.animalName;
    let match;
    
    // Reset regex to start from beginning
    animalPattern.lastIndex = 0;
    
    while ((match = animalPattern.exec(section)) !== null) {
      const animalType = match[1];
      const animalName = match[2];
      const position = this.getCharacterPosition(sectionIndex);
      
      // If the animal has a proper name, it's definitely a character
      if (animalName) {
        // Add the named animal as a character (high confidence)
        this.addCharacter(results, animalName, {
          type: 'namedAnimal',
          species: animalType,
          context: this.getContextAround(section, match.index, 100),
          position: position
        }, 'high', sectionIndex);
        
        // Add relationship between name and animal type
        this.addRelationship(results, animalName, animalType, 'isA', {
          context: this.getContextAround(section, match.index, 50),
          position: position
        }, sectionIndex);
        
        // Add to mentions
        this.addMention(results, animalName, {
          type: 'namedAnimal',
          species: animalType,
          position: position
        }, sectionIndex);
      } 
      // If animal is a common animal term and appears repeatedly, it might be a character
      else if (this.indicators.animalTerms.includes(animalType.toLowerCase())) {
        const characterName = `the ${animalType}`;
        
        // Add with lower confidence
        this.addCharacter(results, characterName, {
          type: 'unnamedAnimal',
          species: animalType,
          context: this.getContextAround(section, match.index, 100),
          position: position
        }, 'low', sectionIndex);
        
        // Add to mentions
        this.addMention(results, characterName, {
          type: 'unnamedAnimal',
          species: animalType,
          position: position
        }, sectionIndex);
      }
    }
  }

  /**
   * Detect "the animal" constructions that might represent characters
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectTheAnimalConstructions(section, results, sectionIndex) {
    const theAnimalPattern = this.regexPatterns.theAnimal;
    let match;
    
    // Reset regex to start from beginning
    theAnimalPattern.lastIndex = 0;
    
    while ((match = theAnimalPattern.exec(section)) !== null) {
      const animalType = match[2];
      const characterName = `the ${animalType}`;
      const position = this.getCharacterPosition(sectionIndex);
      
      // Add with low confidence initially
      this.addCharacter(results, characterName, {
        type: 'theAnimal',
        species: animalType,
        context: this.getContextAround(section, match.index, 100),
        position: position
      }, 'low', sectionIndex);
      
      // Add to mentions
      this.addMention(results, characterName, {
        type: 'theAnimal',
        species: animalType,
        position: position
      }, sectionIndex);
    }
  }

  /**
   * Detect collective references to characters
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectCollectiveReferences(section, results, sectionIndex) {
    const collectivePattern = this.regexPatterns.collectiveReference;
    let match;
    
    // Reset regex to start from beginning
    collectivePattern.lastIndex = 0;
    
    while ((match = collectivePattern.exec(section)) !== null) {
      const determiner = match[1];
      const collectiveType = match[2];
      const collectiveName = `${determiner} ${collectiveType}`;
      const position = this.getCharacterPosition(sectionIndex);
      
      // Add the collective as a potential character group
      this.addCollective(results, collectiveName, [], {
        type: 'collectiveReference',
        collectiveType: collectiveType,
        determiner: determiner,
        context: this.getContextAround(section, match.index, 100),
        position: position
      }, 'medium', sectionIndex);
      
      // Add to collective mentions
      this.addCollectiveMention(results, collectiveName, {
        type: 'collectiveReference',
        context: this.getContextAround(section, match.index, 50),
        position: position
      }, sectionIndex);
    }
  }

  /**
   * Detect characters acting together
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectCharactersActingTogether(section, results, sectionIndex) {
    const actingTogetherPattern = this.regexPatterns.charactersActingTogether;
    let match;
    
    // Reset regex to start from beginning
    actingTogetherPattern.lastIndex = 0;
    
    while ((match = actingTogetherPattern.exec(section)) !== null) {
      const chars = [];
      
      // First character is always in match[1]
      chars.push(match[1]);
      
      // Second character is in match[2]
      if (match[2]) chars.push(match[2]);
      
      // Look for additional characters in the entire match
      const fullMatch = match[0];
      const additionalChars = fullMatch.match(/\band\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
      
      if (additionalChars) {
        for (const charMatch of additionalChars) {
          const charName = charMatch.replace(/\band\s+/, '');
          if (!chars.includes(charName)) {
            chars.push(charName);
          }
        }
      }
      
      // Only process if we have at least 2 characters
      if (chars.length >= 2) {
        const position = this.getCharacterPosition(sectionIndex);
        const collectiveName = chars.join(' and ');
        
        // Add each individual character
        for (const char of chars) {
          this.addCharacter(results, char, {
            type: 'actingTogether',
            group: collectiveName,
            context: this.getContextAround(section, match.index, 100),
            position: position
          }, 'medium', sectionIndex);
          
          // Add relationships between characters
          for (const otherChar of chars) {
            if (char !== otherChar) {
              this.addRelationship(results, char, otherChar, 'actsWithTarget', {
                context: this.getContextAround(section, match.index, 50),
                position: position
              }, sectionIndex);
            }
          }
        }
        
        // Add the collective as a group
        this.addCollective(results, collectiveName, chars, {
          type: 'charactersActingTogether',
          context: this.getContextAround(section, match.index, 100),
          position: position
        }, 'high', sectionIndex);
        
        // Add to collective mentions
        this.addCollectiveMention(results, collectiveName, {
          type: 'charactersActingTogether',
          members: chars,
          position: position
        }, sectionIndex);
      }
    }
  }

  /**
   * Detect enumerated characters that might form a group
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectEnumeratedCharacters(section, results, sectionIndex) {
    const enumeratedPattern = this.regexPatterns.enumeratedCharacters;
    let match;
    
    // Reset regex to start from beginning
    enumeratedPattern.lastIndex = 0;
    
    while ((match = enumeratedPattern.exec(section)) !== null) {
      const chars = [];
      
      // Extract all characters from the match groups
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          chars.push(match[i]);
        }
      }
      
      // Only process if we have at least 2 characters
      if (chars.length >= 2) {
        const position = this.getCharacterPosition(sectionIndex);
        
        // Create group name from the first few characters
        let collectiveName;
        if (chars.length <= 3) {
          collectiveName = chars.join(', ').replace(/, ([^,]+)$/, ' and $1');
        } else {
          collectiveName = `${chars[0]}'s group`;
        }
        
        // Add each individual character
        for (const char of chars) {
          this.addCharacter(results, char, {
            type: 'enumeratedCharacter',
            group: collectiveName,
            context: this.getContextAround(section, match.index, 100),
            position: position
          }, 'medium', sectionIndex);
          
          // Add relationships between characters
          for (const otherChar of chars) {
            if (char !== otherChar) {
              this.addRelationship(results, char, otherChar, 'listedWithTarget', {
                context: this.getContextAround(section, match.index, 50),
                position: position
              }, sectionIndex);
            }
          }
        }
        
        // Add the collective as a group
        this.addCollective(results, collectiveName, chars, {
          type: 'enumeratedCharacters',
          context: this.getContextAround(section, match.index, 100),
          position: position
        }, 'medium', sectionIndex);
        
        // Add to collective mentions
        this.addCollectiveMention(results, collectiveName, {
          type: 'enumeratedCharacters',
          members: chars,
          position: position
        }, sectionIndex);
      }
    }
  }

  /**
   * Detect plural pronouns that might indicate collective action
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectPluralPronouns(section, results, sectionIndex) {
    const pluralPattern = this.regexPatterns.pluralPronouns;
    let match;
    
    // Reset regex to start from beginning
    pluralPattern.lastIndex = 0;
    
    // Keep track of recently active characters
    const recentCharacters = this.getRecentActiveCharacters(results, sectionIndex);
    
    while ((match = pluralPattern.exec(section)) !== null) {
      const pronoun = match[1].toLowerCase();
      const position = this.getCharacterPosition(sectionIndex);
      
      // Skip if not enough context to determine who "they" refers to
      if (recentCharacters.length < 2) continue;
      
      // Create a collective name from recent characters
      let collectiveName;
      if (recentCharacters.length <= 3) {
        collectiveName = recentCharacters.join(', ').replace(/, ([^,]+)$/, ' and $1');
      } else {
        collectiveName = `${recentCharacters[0]}'s group`;
      }
      
      // Add the collective pronoun evidence
      this.addCollective(results, collectiveName, recentCharacters, {
        type: 'pluralPronoun',
        pronoun: pronoun,
        context: this.getContextAround(section, match.index, 100),
        position: position
      }, 'low', sectionIndex);
      
      // Link the characters in this collective
      for (const char of recentCharacters) {
        for (const otherChar of recentCharacters) {
          if (char !== otherChar) {
            this.addRelationship(results, char, otherChar, 'referencedCollectively', {
              context: this.getContextAround(section, match.index, 50),
              pronoun: pronoun,
              position: position
            }, sectionIndex);
          }
        }
      }
    }
  }

  /**
   * Detect indicators of collective action
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectCollectiveActionIndicators(section, results, sectionIndex) {
    const indicatorPattern = this.regexPatterns.collectiveActionIndicator;
    let match;
    
    // Reset regex to start from beginning
    indicatorPattern.lastIndex = 0;
    
    // Get recently active characters and collectives
    const recentCharacters = this.getRecentActiveCharacters(results, sectionIndex);
    const recentCollectives = this.getRecentActiveCollectives(results, sectionIndex);
    
    while ((match = indicatorPattern.exec(section)) !== null) {
      const indicator = match[1];
      const position = this.getCharacterPosition(sectionIndex);
      const context = this.getContextAround(section, match.index, 150);
      
      // If we have a recent collective, strengthen its evidence
      for (const collective of recentCollectives) {
        this.addCollectiveEvidence(results, collective, {
          type: 'collectiveActionIndicator',
          indicator: indicator,
          context: context,
          position: position
        }, 'medium', sectionIndex);
      }
      
      // If we have recent characters but no collective, create one
      if (recentCharacters.length >= 2 && recentCollectives.length === 0) {
        // Create a collective name from recent characters
        let collectiveName;
        if (recentCharacters.length <= 3) {
          collectiveName = recentCharacters.join(', ').replace(/, ([^,]+)$/, ' and $1');
        } else {
          collectiveName = `${recentCharacters[0]}'s group`;
        }
        
        // Add the new collective
        this.addCollective(results, collectiveName, recentCharacters, {
          type: 'impliedCollective',
          indicator: indicator,
          context: context,
          position: position
        }, 'medium', sectionIndex);
        
        // Add to collective mentions
        this.addCollectiveMention(results, collectiveName, {
          type: 'impliedCollective',
          indicator: indicator,
          members: recentCharacters,
          position: position
        }, sectionIndex);
        
        // Link the characters in this collective
        for (const char of recentCharacters) {
          for (const otherChar of recentCharacters) {
            if (char !== otherChar) {
              this.addRelationship(results, char, otherChar, 'actsCollectivelyWith', {
                context: context,
                indicator: indicator,
                position: position
              }, sectionIndex);
            }
          }
        }
      }
    }
  }

  /**
   * Detect the formation of a collective identity
   * @param {string} section - The text section to analyze
   * @param {object} results - Results object to update
   * @param {number} sectionIndex - Index of the section in the narrative
   */
  detectCollectiveIdentityFormation(text, results, sectionIndex) {
    const collectiveIdentityMatches = [...text.matchAll(this.regexPatterns.collectiveIdentityFormation)];
    
    collectiveIdentityMatches.forEach(match => {
      const formationPhrase = match[0];
      const position = match.index + this.currentPosition;
      
      // Look for nearby characters
      const context = text.substring(Math.max(0, match.index - 100), 
                                    Math.min(text.length, match.index + formationPhrase.length + 100));
      
      const characterMatches = [...context.matchAll(this.regexPatterns.properName)];
      const characters = characterMatches.map(m => m[1]);
      
      if (characters.length > 0) {
        // Extract the collective name if possible
        const words = formationPhrase.split(/\s+/);
        const collectiveType = words[words.length - 1];
        
        // Create a formal collective group
        const groupId = `formed_${collectiveType}_${position}`;
        this.addCollective(groupId, 'formed_group', position, results, sectionIndex);
        this.addCollectiveAttribute(groupId, 'type', collectiveType, results);
        this.addCollectiveAttribute(groupId, 'formation_phrase', formationPhrase, results);
        
        // Add characters to the group
        characters.forEach(char => {
          this.addCharacter(char, 'group_member', position, results, sectionIndex);
          this.addMemberToCollective(groupId, char, results);
        });
        
        // Record the formation event
        this.addCollectiveMention(groupId, 'group_formation', formationPhrase, position, results);
        
        // Record this as a high-confidence collective
        if (!results.collectiveConfidence.high.includes(groupId)) {
          results.collectiveConfidence.high.push(groupId);
        }
      }
    });
  }
  
  /**
   * Find recently mentioned characters before a position in text
   * @param {string} text - The text to analyze
   * @param {object} results - The results object
   * @param {number} currentPosition - The current position in the text
   * @return {array} Array of character names
   */
  findRecentCharacters(text, results, currentPosition) {
    const recentChars = new Set();
    const lookbackWindow = 200; // Characters to look back
    
    // Look at recent mentions
    results.mentions.forEach(mention => {
      if (mention.position >= currentPosition - lookbackWindow && 
          mention.position < currentPosition) {
        recentChars.add(mention.character);
      }
    });
    
    return [...recentChars];
  }
  
  /**
   * Process results and assign confidence levels
   * @param {object} results - The results object to process
   */
  processResults(results) {
    // Process characters
    results.characters.forEach((data, character) => {
      // Count mentions for each character
      const mentions = results.mentions.filter(m => m.character === character).length;
      data.mentions = mentions;
      
      // Assign confidence level based on detection method and mentions
      if (data.detectionMethod === 'dialogue_attribution' || 
          data.detectionMethod === 'titled_name' || 
          data.detectionMethod === 'named_animal' ||
          mentions > 2) {
        results.confidence.high.push(character);
      } else if (data.detectionMethod === 'proper_name' || 
                data.detectionMethod === 'action_subject' || 
                mentions > 0) {
        results.confidence.medium.push(character);
      } else {
        results.confidence.low.push(character);
      }
    });
    
    // Process collectives
    results.collectives.forEach((data, collective) => {
      // Count mentions for each collective
      const mentions = results.collectiveMentions.filter(m => m.collective === collective).length;
      data.mentions = mentions;
      
      // Count members in the collective
      const memberCount = data.members ? data.members.length : 0;
      
      // Assign confidence level based on detection method, mentions, and member count
      if (data.type === 'formed_group' || 
          data.type === 'character_pair' ||
          mentions > 2 || 
          memberCount > 2) {
        results.collectiveConfidence.high.push(collective);
      } else if (data.type === 'enumerated_characters' || 
                data.type === 'collective_action' || 
                mentions > 0 ||
                memberCount > 0) {
        results.collectiveConfidence.medium.push(collective);
      } else {
        results.collectiveConfidence.low.push(collective);
      }
    });
  }
  
  /**
   * NEW: Analyze character transitions from individual to collective
   * @param {object} results - The results object to analyze
   */
  analyzeCharacterTransitions(results) {
    // Track characters that appear individually first, then in collectives
    const characterTimeline = new Map();
    
    // Process character mentions chronologically
    results.mentions.sort((a, b) => a.position - b.position).forEach(mention => {
      if (!characterTimeline.has(mention.character)) {
        characterTimeline.set(mention.character, {
          firstIndividual: mention.position,
          firstCollective: null
        });
      }
    });
    
    // Process collective mentions chronologically
    results.collectiveMentions.sort((a, b) => a.position - b.position).forEach(mention => {
      const collective = results.collectives.get(mention.collective);
      
      if (collective && collective.members) {
        collective.members.forEach(member => {
          if (characterTimeline.has(member)) {
            const timeline = characterTimeline.get(member);
            
            // Record the first collective appearance if not already set
            if (timeline.firstCollective === null) {
              timeline.firstCollective = mention.position;
            }
          }
        });
      }
    });
    
    // Analyze transitions
// First forEach loop
characterTimeline.forEach((timeline, character) => {
  if (timeline.firstIndividual !== null && timeline.firstCollective !== null) {
    // Character appears individually first, then collectively
    if (timeline.firstIndividual < timeline.firstCollective) {
      results.timeline.push({
        character,
        type: 'individual_to_collective',
        individualPosition: timeline.firstIndividual,
        collectivePosition: timeline.firstCollective
      });
    }
    // Character appears collectively first, then individually
    else if (timeline.firstCollective < timeline.firstIndividual) {
      results.timeline.push({
        character,
        type: 'collective_to_individual',
        collectivePosition: timeline.firstCollective,
        individualPosition: timeline.firstIndividual
      });
    }
  }
});
}

/*** NEW: Identify and categorize character transitions between individual and collective states
* @param {object} results - The results object containing timeline data
* @return {array} Array of transition objects
*/
identifyCharacterTransitions(results) {
const transitions = [];

// Process timeline events to create transition objects
results.timeline.forEach(event => {
  if (event.type === 'individual_to_collective') {
    transitions.push({
      character: event.character,
      transitionType: 'individual_to_collective',
      positions: {
        individual: event.individualPosition,
        collective: event.collectivePosition
      },
      sectionSpan: this.calculateSectionSpan(event.individualPosition, event.collectivePosition)
    });
  } else if (event.type === 'collective_to_individual') {
    transitions.push({
      character: event.character,
      transitionType: 'collective_to_individual',
      positions: {
        collective: event.collectivePosition,
        individual: event.individualPosition
      },
      sectionSpan: this.calculateSectionSpan(event.collectivePosition, event.individualPosition)
    });
  }
});

return transitions;
}

/*** Calculate number of sections spanned by a transition
* @param {number} startPos - Start position in text
* @param {number} endPos - End position in text
* @return {number} Number of sections spanned
*/
calculateSectionSpan(startPos, endPos) {
const startSection = this.narrativeTimeline.findIndex(pos => pos >= startPos);
const endSection = this.narrativeTimeline.findIndex(pos => pos >= endPos);
return Math.abs(endSection - startSection) + 1;
}
}

export { EnhancedCharacterDetector };