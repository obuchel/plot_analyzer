/**
 * Enhanced Character Detection System with Animal Character Support
 * and Collective Character Action Detection
 * This version detects individual characters and how they transition to acting collectively
 */

class EnhancedCharacterDetector {
  constructor() {
    // Initialize detection dictionaries
    this.indicators = {
      // Basic character indicators
      pronouns: [
        'he', 'she', 'they', 'him', 'her', 'them', 'his', 'hers', 'their', 'theirs',
        'himself', 'herself', 'themselves', 'i', 'me', 'my', 'mine', 'myself', 'you', 
        'your', 'yours', 'yourself', 'we', 'us', 'our', 'ours', 'ourselves'
      ],
      
      // Explicit character terms (added animal-related terms)
      explicitTerms: [
        'character', 'person', 'man', 'woman', 'boy', 'girl', 'child', 'children', 'people',
        'protagonist', 'antagonist', 'hero', 'heroine', 'villain', 'narrator', 'figure',
        // Animal character terms
        'animal', 'creature', 'beast', 'critter', 'pet'
      ],
      
      // Animal-specific terms
      animalTerms: [
        // Common pets
        'dog', 'cat', 'bird', 'parrot', 'canary', 'hamster', 'gerbil', 'guinea pig', 'rabbit',
        'turtle', 'fish', 'goldfish', 'mouse', 'rat',
        
        // Farm animals
        'horse', 'cow', 'pig', 'sheep', 'goat', 'chicken', 'rooster', 'duck', 'goose',
        'turkey', 'donkey', 'mule', 'ox', 'bull', 'calf', 'lamb', 'piglet', 'foal', 'chick',
        
        // Wild animals
        'lion', 'tiger', 'bear', 'wolf', 'fox', 'deer', 'moose', 'elk', 'bison', 'buffalo',
        'elephant', 'giraffe', 'monkey', 'ape', 'gorilla', 'chimpanzee', 'zebra', 'hippo',
        'rhino', 'crocodile', 'alligator', 'snake', 'lizard', 'frog', 'toad', 'turtle',
        'tortoise', 'eagle', 'hawk', 'owl', 'falcon', 'robin', 'sparrow', 'finch', 'cardinal',
        'bluejay', 'crow', 'raven', 'magpie', 'squirrel', 'chipmunk', 'beaver', 'badger',
        'raccoon', 'skunk', 'opossum', 'kangaroo', 'koala', 'panda', 'seal', 'walrus',
        'penguin', 'dolphin', 'whale', 'shark', 'octopus', 'squid', 'butterfly', 'bee',
        'ant', 'spider', 'scorpion',
        
        // Fantasy animals
        'dragon', 'unicorn', 'griffin', 'phoenix', 'centaur', 'minotaur', 'pegasus',
        'kraken', 'yeti', 'sasquatch', 'bigfoot', 'werewolf'
      ],
      
      // Relationship indicators (added animal relationships)
      relationships: [
        // Family relationships
        'father', 'mother', 'dad', 'mom', 'brother', 'sister', 'son', 'daughter', 
        'uncle', 'aunt', 'cousin', 'grandfather', 'grandmother', 'grandpa', 'grandma',
        'husband', 'wife', 'spouse', 'parent', 'child', 'sibling', 'family',
        
        // Social relationships
        'friend', 'enemy', 'ally', 'foe', 'colleague', 'partner', 'neighbor',
        'acquaintance', 'companion', 'lover', 'ex', 'roommate', 'guest', 'host',
        'client', 'customer', 'patient', 'stranger', 'visitor', 'associate',
        
        // Professional relationships
        'boss', 'employee', 'manager', 'supervisor', 'worker', 'staff', 'colleague',
        'coworker', 'teammate', 'leader', 'follower', 'mentor', 'apprentice',
        'teacher', 'student', 'professor', 'pupil', 'client', 'assistant',
        
        // Animal-specific relationships
        'owner', 'master', 'pet', 'companion', 'herd', 'pack', 'flock', 'pride',
        'mate', 'cub', 'puppy', 'kitten', 'offspring', 'nest', 'den', 'hive',
        'alpha', 'beta', 'omega', 'leader', 'predator', 'prey', 'hunter', 'keeper',
        'trainer', 'rider'
      ],
      
      // Occupations and roles (added animal-specific roles)
      occupations: [
        // Professional roles
        'doctor', 'nurse', 'lawyer', 'engineer', 'scientist', 'teacher', 'professor',
        'artist', 'writer', 'musician', 'actor', 'actress', 'director', 'designer',
        'programmer', 'developer', 'chef', 'cook', 'waiter', 'waitress', 'barista',
        'bartender', 'clerk', 'cashier', 'salesperson', 'consultant', 'analyst',
        
        // Animal-specific roles
        'hunter', 'gatherer', 'scavenger', 'messenger', 'guardian', 'protector',
        'scout', 'lookout', 'tracker', 'leader', 'elder', 'chief', 'shaman',
        'healer', 'caretaker', 'provider', 'alpha', 'defender', 'worker', 'queen',
        'king', 'ruler', 'prince', 'princess', 'knight', 'ambassador', 'spy',
        'messenger', 'sentry', 'guard', 'watchdog', 'guide', 'companion', 'helper',
        'assistant', 'servant', 'mount', 'steed', 'beast of burden', 'performer'
      ],
      
      // Titles that often precede character names
      titles: [
        'mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sir', 'dame', 'lady', 'lord',
        'captain', 'major', 'colonel', 'general', 'admiral', 'lieutenant', 'sergeant',
        'officer', 'inspector', 'detective', 'agent', 'reverend', 'bishop', 'father',
        'sister', 'brother', 'elder', 'king', 'queen', 'prince', 'princess', 'duke',
        'duchess', 'baron', 'baroness', 'count', 'countess', 'emperor', 'empress',
        // Animal-specific titles
        'old', 'young', 'great', 'mighty', 'brave', 'wise', 'swift', 'fierce', 'gentle'
      ],
      
      // NEW: Group/collective terms for characters
      collectiveTerms: [
        // General group terms
        'group', 'team', 'crowd', 'gang', 'band', 'party', 'crew', 'squad', 'company',
        'troop', 'troupe', 'ensemble', 'cast', 'association', 'society', 'club', 'committee',
        'council', 'board', 'panel', 'staff', 'congregation', 'gathering', 'assembly',
        'family', 'couple', 'pair', 'trio', 'quartet', 'quintet', 'dozen', 'brigade',
        'battalion', 'regiment', 'platoon', 'squadron', 'unit', 'division', 'corps',
        'alliance', 'coalition', 'union', 'league', 'federation', 'posse', 'mob',
        
        // Animal-specific group terms
        'pack', 'herd', 'flock', 'pride', 'murder', 'school', 'pod', 'colony', 'swarm',
        'hive', 'brood', 'litter', 'nest', 'gaggle', 'parliament', 'murder', 'conspiracy',
        'army', 'cloud', 'clowder', 'congregation', 'drove', 'skulk', 'troop', 'fleet',
        'shoal', 'team', 'sloth', 'rafter', 'flight', 'bale', 'crash', 'obstinacy',
        'parade', 'leap', 'tower', 'business', 'coalition', 'caravan', 'bloat', 'clan',
        'tribe', 'colony', 'rookery', 'bed', 'knot', 'bevy', 'covey', 'kettle',
        
        // Fantasy-specific group terms
        'fellowship', 'guild', 'clan', 'tribe', 'coven', 'order', 'circle', 'cabal',
        'brotherhood', 'sisterhood', 'chapter', 'covenant', 'cult', 'sect', 'legion',
        'horde', 'warband', 'host', 'cohort', 'expedition', 'quest', 'campaign'
      ],
      
      // NEW: Terms that show a transition to collective action
      collectiveActionIndicators: [
        'together', 'jointly', 'collectively', 'as one', 'in unison', 'in concert',
        'in harmony', 'simultaneously', 'all at once', 'in tandem', 'joined forces',
        'worked together', 'collaborated', 'cooperated', 'coordinated', 'united',
        'combined', 'merged', 'gathered', 'assembled', 'convened', 'congregated',
        'converged', 'rallied', 'mustered', 'mobilized', 'formed', 'organized', 'banded',
        'aligned', 'allied', 'partnered', 'teamed up', 'ganged up', 'grouped together',
        'came together', 'met up', 'rendezvoused', 'reunited', 'reassembled', 'rejoined',
        'all of them', 'both of them', 'the group', 'the team', 'the party', 'the crew',
        'the gang', 'the company', 'the band', 'the fellowship', 'the allies', 'the friends'
      ]
    };
    
    // Verbs and patterns for dialog and action detection
    this.verbPatterns = {
      // Speech attribution verbs (added animal sounds)
      speechVerbs: [
        'said', 'asked', 'replied', 'shouted', 'whispered', 'murmured', 'exclaimed',
        'announced', 'stated', 'declared', 'questioned', 'answered', 'responded',
        'called', 'cried', 'muttered', 'yelled', 'spoke', 'remarked', 'uttered',
        'mentioned', 'suggested', 'added', 'continued', 'began', 'interrupted',
        'interjected', 'concluded', 'repeated', 'echoed', 'sighed', 'groaned',
        'mumbled', 'chuckled', 'laughed', 'gasped', 'stammered', 'stuttered',
        // Animal sound verbs
        'barked', 'meowed', 'growled', 'howled', 'roared', 'chirped', 'squawked',
        'screeched', 'squeaked', 'squealed', 'grunted', 'snorted', 'bellowed',
        'brayed', 'neighed', 'mooed', 'bleated', 'clucked', 'quacked', 'honked',
        'hissed', 'croaked', 'hooted', 'cawed', 'trumpeted', 'whinnied', 'purred',
        'woofed', 'yelped', 'whimpered', 'snarled', 'chattered', 'chittered'
      ],
      
      // Mental verbs that indicate character thoughts
      mentalVerbs: [
        'thought', 'wondered', 'realized', 'remembered', 'imagined', 'considered',
        'believed', 'decided', 'knew', 'understood', 'hoped', 'feared', 'worried',
        'dreamed', 'recalled', 'contemplated', 'suspected', 'doubted', 'assumed',
        'speculated', 'reflected', 'concluded', 'determined', 'calculated',
        // Animal-oriented mental verbs
        'sensed', 'instinctively knew', 'felt', 'perceived'
      ],
      
      // Action verbs frequently associated with character actions (added animal-specific actions)
      actionVerbs: [
        'walked', 'ran', 'jumped', 'moved', 'stood', 'sat', 'turned', 'looked',
        'watched', 'saw', 'heard', 'felt', 'touched', 'grabbed', 'took', 'put',
        'placed', 'lifted', 'dropped', 'threw', 'caught', 'held', 'carried',
        'pushed', 'pulled', 'opened', 'closed', 'entered', 'left', 'arrived',
        'departed', 'smiled', 'frowned', 'laughed', 'cried', 'sighed', 'nodded',
        'shook', 'winked', 'blinked', 'stared', 'glared', 'gazed', 'ate', 'drank',
        'slept', 'woke', 'dressed', 'undressed', 'reached', 'pointed', 'waved', 'looked up',
        // Animal-specific action verbs
        'trotted', 'galloped', 'flew', 'swam', 'dove', 'soared', 'glided', 'crawled',
        'slithered', 'pounced', 'leaped', 'bounded', 'hopped', 'scurried', 'prowled',
        'stalked', 'chased', 'hunted', 'foraged', 'scavenged', 'nested', 'perched',
        'roosted', 'grazed', 'nibbled', 'gnawed', 'scratched', 'clawed', 'pecked',
        'sniffed', 'smelled', 'wagged', 'flapped', 'ruffled', 'preened', 'groomed',
        'licked', 'nuzzled', 'burrowed', 'dug', 'marked', 'circled', 'herded'
      ],
      
      // Emotional expression verbs (added animal expressions)
      emotionVerbs: [
        'smiled', 'frowned', 'laughed', 'cried', 'sighed', 'groaned', 'sobbed',
        'grinned', 'smirked', 'grimaced', 'scowled', 'beamed', 'glowered', 'wept',
        'chuckled', 'giggled', 'snorted', 'sneered', 'blushed', 'paled', 'winced',
        'flinched', 'shuddered', 'trembled', 'quivered', 'shivered', 'fumed',
        // Animal emotional expressions
        'wagged', 'purred', 'bristled', 'cowered', 'whimpered', 'yipped', 'yowled',
        'hunkered', 'crouched', 'arched', 'pricked', 'flattened', 'bared', 'snapped',
        'snarled', 'nuzzled', 'licked', 'preened', 'ruffled', 'fluffed', 'relaxed',
        'tensed', 'drooped', 'perked up', 'growled', 'whined'
      ],
      
      // NEW: Verbs that indicate collective action
      collectiveActionVerbs: [
        'gathered', 'met', 'assembled', 'convened', 'congregated', 'converged',
        'united', 'joined', 'combined', 'collaborated', 'cooperated', 'coordinated',
        'teamed up', 'formed', 'organized', 'banded together', 'allied', 'partnered',
        'grouped', 'huddled', 'clustered', 'flocked', 'herded', 'swarmed', 'massed',
        'crowded', 'rallied', 'mobilized', 'deployed', 'marched', 'advanced', 'retreated',
        'charged', 'attacked', 'defended', 'protected', 'guarded', 'escorted', 'accompanied',
        'traveled', 'journeyed', 'ventured', 'explored', 'searched', 'hunted', 'foraged',
        'celebrated', 'mourned', 'feasted', 'rested', 'slept', 'camped', 'settled',
        'decided', 'agreed', 'planned', 'strategized', 'plotted', 'discussed', 'debated',
        'argued', 'negotiated', 'voted', 'elected', 'chose', 'selected', 'appointed',
        'worked', 'built', 'created', 'constructed', 'engineered', 'designed', 'developed',
        'invented', 'discovered', 'found', 'located', 'identified', 'recognized', 'spotted'
      ]
    };
    
    // Patterns for character descriptions
    this.descriptionPatterns = {
      // Physical attributes (added animal attributes)
      physicalAttributes: [
        'tall', 'short', 'thin', 'fat', 'slim', 'heavy', 'fit', 'strong', 'weak',
        'handsome', 'beautiful', 'pretty', 'ugly', 'plain', 'attractive', 'young',
        'old', 'elderly', 'middle-aged', 'teenage', 'adolescent', 'adult', 'senior',
        'blonde', 'brunette', 'redhead', 'gray-haired', 'bald', 'bearded', 'clean-shaven',
        // Animal physical attributes
        'furry', 'fluffy', 'fuzzy', 'hairy', 'feathered', 'scaly', 'sleek', 'shaggy',
        'spotted', 'striped', 'speckled', 'mottled', 'dappled', 'black', 'white',
        'brown', 'red', 'gray', 'golden', 'silver', 'orange', 'yellow', 'green',
        'blue', 'purple', 'pink', 'tan', 'cream', 'chestnut', 'roan', 'bay',
        'large', 'small', 'tiny', 'giant', 'enormous', 'massive', 'miniature',
        'stocky', 'lanky', 'lean', 'plump', 'stout', 'slender', 'long-legged',
        'short-legged', 'long-tailed', 'bushy-tailed', 'bob-tailed', 'stub-tailed',
        'long-eared', 'floppy-eared', 'pointed-eared', 'long-necked', 'short-necked',
        'broad-shouldered', 'narrow-shouldered', 'wide-eyed', 'sharp-eyed', 'keen-eyed',
        'bright-eyed', 'quick', 'slow', 'agile', 'nimble', 'graceful', 'clumsy'
      ],
      
      // Personality traits (added animal personality traits)
      personalityTraits: [
        'kind', 'cruel', 'nice', 'mean', 'friendly', 'hostile', 'brave', 'cowardly',
        'bold', 'timid', 'shy', 'outgoing', 'introverted', 'extroverted', 'cheerful',
        'gloomy', 'optimistic', 'pessimistic', 'generous', 'greedy', 'patient', 'impatient',
        'honest', 'dishonest', 'loyal', 'treacherous', 'humble', 'proud', 'arrogant',
        'confident', 'insecure', 'intelligent', 'stupid', 'clever', 'witty', 'dull',
        // Animal personality traits
        'playful', 'mischievous', 'curious', 'cautious', 'alert', 'watchful', 'wary',
        'suspicious', 'trusting', 'dominant', 'submissive', 'aggressive', 'gentle',
        'fierce', 'wild', 'tame', 'docile', 'skittish', 'nervous', 'relaxed', 'calm',
        'excitable', 'energetic', 'lazy', 'active', 'restless', 'territorial', 'protective',
        'maternal', 'paternal', 'loyal', 'faithful', 'devoted', 'independent', 'stubborn',
        'obedient', 'trainable', 'untamed', 'feral', 'sociable', 'solitary', 'pack-oriented',
        'predatory', 'stealthy', 'cunning', 'crafty', 'sly', 'sneaky', 'instinctive'
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
      
      // Pattern for recognizing title + name combinations
      titleName: new RegExp(`\\b(${['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sir', 'lady', 'lord', 'captain', 'major', 'old', 'young', 'great', 'mighty', 'brave', 'wise', 'swift', 'fierce', 'gentle'].join('|')})\\.?\\s+([A-Z][a-z]+)`, 'gi'),
      
      // Pattern for animal-specific character detection
      animalName: /(?:^|[.!?]\s+|\s+)(?:the|a|an)\s+([a-z]+)(?:\s+named\s+([A-Z][a-z]+))?/gi,
      
      // Pattern for "the animal" constructions that might indicate characters
      theAnimal: new RegExp(`\\b(the)\\s+(${this.indicators.animalTerms.join('|')})\\b`, 'gi'),
      
      // NEW: Pattern for detecting collective references to characters
      collectiveReference: new RegExp(`\\b(the|a|an|our|their|his|her)\\s+(${this.indicators.collectiveTerms.join('|')})\\b`, 'gi'),
      
      // NEW: Pattern for detecting characters acting together
      charactersActingTogether: /\b([A-Z][a-z]+)(?:\s+and\s+([A-Z][a-z]+))+\b/g,
      
      // NEW: Pattern for detecting enumerated characters that might act as a group
      enumeratedCharacters: /\b([A-Z][a-z]+),\s+([A-Z][a-z]+)(?:,\s+([A-Z][a-z]+))*(?:,?\s+and\s+([A-Z][a-z]+))\b/g,
      
      // NEW: Pattern for detecting plural pronouns that might indicate collective action
      pluralPronouns: /\b(they|them|their|theirs|themselves|we|us|our|ours|ourselves)\b/gi,
      
      // NEW: Pattern for detecting collective action indicators
      collectiveActionIndicator: new RegExp(`\\b(${this.indicators.collectiveActionIndicators.join('|')})\\b`, 'gi'),
      
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
      confidence: {
        high: [],
        medium: [],
        low: []
      },
      collectiveConfidence: {
        high: [],
        medium: [],
        low: []
      }
    };
    
    // Split text into sections for chronological analysis
    const sections = this.splitIntoSections(text);
    
    // Process each section to maintain narrative order
    sections.forEach((section, sectionIndex) => {
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
      this.currentPosition += section.length;
    });
    
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
  
  /**
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
    const sentences = text.split(/(?<=[.!?])\s+/);
    const sections = [];
    let currentSection = '';
    
    sentences.forEach((sentence, index) => {
      currentSection += sentence + ' ';
      
      // Group approximately every 3-5 sentences or at natural breaks
      if (index % 4 === 0 || index === sentences.length - 1) {
        sections.push(currentSection.trim());
        currentSection = '';
        }
        });
        
        return sections;
        }
        
        /**
        
        Detect proper names (capitalized words not at start of sentence)
        */
        detectProperNames(section, results, sectionIndex) {
        const matches = [...section.matchAll(this.regexPatterns.properName)];
        
        matches.forEach(match => {
        const name = match[1];
        const position = this.currentPosition + match.index;
        
        if (!this.isCommonWord(name)) {
          this.recordCharacter(name, results, position, sectionIndex, 'proper name');
        }
        });
        }
        
        /**
        
        Detect dialogue attributions (quoted speech with speaker)
        */
        detectDialogueAttributions(section, results, sectionIndex) {
        // Check for quoted speech with various attribution patterns
        const patterns = [
        this.regexPatterns.quotedSpeech,
        this.regexPatterns.emDashDialogue,
        this.regexPatterns.singleQuoteDialogue
        ];
        
        patterns.forEach(pattern => {
        const matches = [...section.matchAll(pattern)];
        
        matches.forEach(match => {
          // The quoted text is in match[1]
          // Possible speaker patterns vary based on regex
          let speaker = null;
          let verb = null;
          
          // Determine which capture groups were matched
          if (match[2] && match[3]) { // "text," verb Name
            verb = match[2];
            speaker = match[3];
          } else if (match[4] && match[5]) { // "text" Name verb
            speaker = match[4];
            verb = match[5];
          } else if (match[6] && match[7]) { // "text," verb the role
            verb = match[6];
            speaker = `the ${match[7]}`;
          }
          
          if (speaker && verb && this.verbPatterns.speechVerbs.includes(verb)) {
            const position = this.currentPosition + match.index;
            this.recordCharacter(speaker, results, position, sectionIndex, 'dialogue attribution');
          }
        });
        });
        }
        
        /**
        
        Detect titled names (Mr., Dr., etc.)
        */
        detectTitledNames(section, results, sectionIndex) {
        const matches = [...section.matchAll(this.regexPatterns.titleName)];
        
        matches.forEach(match => {
        const title = match[1];
        const name = match[2];
        const fullName = ${title} ${name};
        const position = this.currentPosition + match.index;
        
        this.recordCharacter(fullName, results, position, sectionIndex, 'titled name');
        });
        }
        
        /**
        
        Detect subjects of action verbs
        */
        detectActionSubjects(section, results, sectionIndex) {
        // This is a simplified version - a full implementation would need proper parsing
        const sentences = section.split(/(?<=[.!?])\s+/);
        
        sentences.forEach(sentence => {
        const words = sentence.split(/\s+/);
        
        for (let i = 0; i < words.length; i++) {
          const word = words[i].replace(/[^a-zA-Z]/g, '').toLowerCase();
          
          if (this.verbPatterns.actionVerbs.includes(word) ||
              this.verbPatterns.emotionVerbs.includes(word) ||
              this.verbPatterns.mentalVerbs.includes(word)) {
            
            // Look for subject before verb
            for (let j = i - 1; j >= 0; j--) {
              const potentialSubject = words[j];
              
              // Check if it's a proper name or pronoun
              if (potentialSubject.match(/^[A-Z][a-z]+$/) && !this.isCommonWord(potentialSubject)) {
                const position = this.currentPosition + section.indexOf(potentialSubject);
                this.recordCharacter(potentialSubject, results, position, sectionIndex, 'action subject');
                break;
              } else if (this.indicators.pronouns.includes(potentialSubject.toLowerCase())) {
                // Handle pronouns by looking for their antecedents (simplified)
                const position = this.currentPosition + section.indexOf(potentialSubject);
                this.recordCharacter(potentialSubject, results, position, sectionIndex, 'pronoun reference', 0.5);
                break;
              }
            }
          }
        }
        });
        }
        
        /**
        
        Detect character descriptions
        */
        detectCharacterDescriptions(section, results, sectionIndex) {
        const matches = [...section.matchAll(this.regexPatterns.characterDescription)];
        
        matches.forEach(match => {
        const description = match[0];
        const position = this.currentPosition + match.index;
        
        this.recordCharacter(description, results, position, sectionIndex, 'character description');
        });
        }
        
        /**
        
        Detect occupations and roles that indicate characters
        */
        detectOccupationsAndRoles(section, results, sectionIndex) {
        const words = section.split(/\s+/);
        
        words.forEach((word, index) => {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
        
        if (this.indicators.occupations.includes(cleanWord) || 
            this.indicators.relationships.includes(cleanWord)) {
          
          // Look for a preceding article or possessive
          if (index > 0) {
            const preceding = words[index - 1].toLowerCase();
            
            if (['the', 'a', 'an', 'his', 'her', 'their', 'our', 'my', 'your'].includes(preceding)) {
              const fullTerm = `${preceding} ${cleanWord}`;
              const position = this.currentPosition + section.indexOf(fullTerm);
              this.recordCharacter(fullTerm, results, position, sectionIndex, 'occupation/role');
            }
          }
        }
        });
        }
        
        /**
        
        Detect animal characters
        */
        detectAnimalCharacters(section, results, sectionIndex) {
        const matches = [...section.matchAll(this.regexPatterns.animalName)];
        
        matches.forEach(match => {
        const animalType = match[1];
        const animalName = match[2];
        
        if (this.indicators.animalTerms.includes(animalType.toLowerCase())) {
          const character = animalName ? `${animalName} the ${animalType}` : `the ${animalType}`;
          const position = this.currentPosition + match.index;
          this.recordCharacter(character, results, position, sectionIndex, 'animal character');
        }
        });
        }
        
        /**
        
        Detect "the animal" constructions
        */
        detectTheAnimalConstructions(section, results, sectionIndex) {
        const matches = [...section.matchAll(this.regexPatterns.theAnimal)];
        
        matches.forEach(match => {
        const article = match[1];
        const animal = match[2];
        const character = ${article} ${animal};
        const position = this.currentPosition + match.index;
        
        this.recordCharacter(character, results, position, sectionIndex, 'animal reference');
        });
        }
        
        /**
        
        NEW: Detect collective references to characters
        */
        detectCollectiveReferences(section, results, sectionIndex) {
        const matches = [...section.matchAll(this.regexPatterns.collectiveReference)];
        
        matches.forEach(match => {
        const article = match[1];
        const collective = match[2];
        const fullTerm = ${article} ${collective};
        const position = this.currentPosition + match.index;
        
        this.recordCollective(fullTerm, results, position, sectionIndex, 'collective reference');
        });
        }
        
        /**
        
        NEW: Detect characters acting together
        */
        detectCharactersActingTogether(section, results, sectionIndex) {
        const matches = [...section.matchAll(this.regexPatterns.charactersActingTogether)];
        
        matches.forEach(match => {
        const characters = [];
        for (let i = 1; i < match.length; i++) {
        if (match[i]) characters.push(match[i]);
        }
        
        if (characters.length >= 2) {
          const position = this.currentPosition + match.index;
          this.recordCollective(characters.join(' and '), results, position, sectionIndex, 'characters acting together');
          
          // Record relationships between these characters
          characters.forEach((char1, i) => {
            characters.slice(i + 1).forEach(char2 => {
              this.recordRelationship(char1, char2, 'associated with', position, results);
            });
          });
        }
        });
        }
        
        /**
        
        NEW: Detect enumerated characters that might act as a group
        */
        detectEnumeratedCharacters(section, results, sectionIndex) {
        const matches = [...section.matchAll(this.regexPatterns.enumeratedCharacters)];
        
        matches.forEach(match => {
        const characters = [];
        for (let i = 1; i < match.length; i++) {
        if (match[i]) characters.push(match[i]);
        }
        
        if (characters.length >= 2) {
          const position = this.currentPosition + match.index;
          const groupName = `${characters.slice(0, -1).join(', ')} and ${characters[characters.length - 1]}`;
          this.recordCollective(groupName, results, position, sectionIndex, 'enumerated characters');
          
          // Record relationships between these characters
          characters.forEach((char1, i) => {
            characters.slice(i + 1).forEach(char2 => {
              this.recordRelationship(char1, char2, 'associated with', position, results);
            });
          });
        }
        });
        }
        
        /**
        
        NEW: Detect plural pronouns that might indicate collective action
        */
        detectPluralPronouns(section, results, sectionIndex) {
        const matches = [...section.matchAll(this.regexPatterns.pluralPronouns)];
        
        matches.forEach(match => {
        const pronoun = match[0];
        const position = this.currentPosition + match.index;
        
        // This is a low-confidence indicator since pronouns require context
        this.recordCollective(pronoun, results, position, sectionIndex, 'plural pronoun', 0.3);
        });
        }
        
        /**
        
        NEW: Detect collective action indicators
        */
        detectCollectiveActionIndicators(section, results, sectionIndex) {
        const matches = [...section.matchAll(this.regexPatterns.collectiveActionIndicator)];
        
        matches.forEach(match => {
        const indicator = match[0];
        const position = this.currentPosition + match.index;
        
        // Look for nearby character references
        const context = section.substring(Math.max(0, match.index - 50), Math.min(section.length, match.index + 50));
        
        // Check for character references in the context
        const characterRefs = [];
        const nameMatches = [...context.matchAll(/([A-Z][a-z]+)/g)];
        nameMatches.forEach(nameMatch => {
          if (!this.isCommonWord(nameMatch[0])) {
            characterRefs.push(nameMatch[0]);
          }
        });
        
        if (characterRefs.length > 0) {
          this.recordCollective(characterRefs.join(' and '), results, position, sectionIndex, `collective action: ${indicator}`);
          
          // Record relationships between these characters
          characterRefs.forEach((char1, i) => {
            characterRefs.slice(i + 1).forEach(char2 => {
              this.recordRelationship(char1, char2, `acted ${indicator} with`, position, results);
            });
          });
        }
        });
        }
        
        /**
        
        NEW: Detect formation of collective identity
        */
        detectCollectiveIdentityFormation(section, results, sectionIndex) {
        const matches = [...section.matchAll(this.regexPatterns.collectiveIdentityFormation)];
        
        matches.forEach(match => {
        const fullPhrase = match[0];
        const position = this.currentPosition + match.index;
        
        // Look for character references in the surrounding context
        const context = section.substring(Math.max(0, match.index - 100), Math.min(section.length, match.index + 100));
        const characterRefs = [];
        
        // Check for proper names
        const nameMatches = [...context.matchAll(/([A-Z][a-z]+)/g)];
        nameMatches.forEach(nameMatch => {
          if (!this.isCommonWord(nameMatch[0])) {
            characterRefs.push(nameMatch[0]);
          }
        });
        
        // Check for pronouns
        const pronounMatches = [...context.matchAll(/\b(they|we|us|our)\b/gi)];
        pronounMatches.forEach(pronounMatch => {
          characterRefs.push(pronounMatch[0]);
        });
        
        if (characterRefs.length > 0) {
          const groupName = fullPhrase.match(/formed\s+(a|the|their)\s+([a-z]+)/i)?.[2] || 'group';
          this.recordCollective(groupName, results, position, sectionIndex, `collective formation: ${fullPhrase}`);
          
          // Record relationships between these characters
          characterRefs.forEach((char1, i) => {
            characterRefs.slice(i + 1).forEach(char2 => {
              this.recordRelationship(char1, char2, `formed ${groupName} with`, position, results);
            });
          });
        }
        });
        }
        
        /**
        
        Helper method to record a character detection
        */
        recordCharacter(name, results, position, sectionIndex, detectionMethod, confidence = 1.0) {
        const normalizedName = this.normalizeName(name);
        
        if (!results.characters.has(normalizedName)) {
        results.characters.set(normalizedName, {
        name: normalizedName,
        originalName: name,
        mentions: [],
        detectionMethods: new Set(),
        confidence: 0,
        positions: [],
        sectionIndices: new Set()
        });
        }
        
        const character = results.characters.get(normalizedName);
        character.mentions.push({
        text: name,
        position,
        sectionIndex,
        detectionMethod,
        confidence
        });
        character.detectionMethods.add(detectionMethod);
        character.positions.push(position);
        character.sectionIndices.add(sectionIndex);
        character.confidence = Math.min(1.0, character.confidence + confidence);
        
        // Record in timeline
        results.timeline.push({
        type: 'character',
        name: normalizedName,
        position,
        sectionIndex,
        detectionMethod
        });
        
        // Record mention
        results.mentions.push({
        name: normalizedName,
        text: name,
        position,
        sectionIndex,
        detectionMethod
        });
        }
        
        /**
        
        NEW: Helper method to record a collective detection
        */
        recordCollective(name, results, position, sectionIndex, detectionMethod, confidence = 1.0) {
        const normalizedName = this.normalizeName(name);
        
        if (!results.collectives.has(normalizedName)) {
        results.collectives.set(normalizedName, {
        name: normalizedName,
        originalName: name,
        mentions: [],
        detectionMethods: new Set(),
        confidence: 0,
        positions: [],
        sectionIndices: new Set()
        });
        }
        
        const collective = results.collectives.get(normalizedName);
        collective.mentions.push({
        text: name,
        position,
        sectionIndex,
        detectionMethod,
        confidence
        });
        collective.detectionMethods.add(detectionMethod);
        collective.positions.push(position);
        collective.sectionIndices.add(sectionIndex);
        collective.confidence = Math.min(1.0, collective.confidence + confidence);
        
        // Record in timeline
        results.timeline.push({
        type: 'collective',
        name: normalizedName,
        position,
        sectionIndex,
        detectionMethod
        });
        
        // Record mention
        results.collectiveMentions.push({
        name: normalizedName,
        text: name,
        position,
        sectionIndex,
        detectionMethod
        });
        }
        
        /**
        
        NEW: Helper method to record relationships between characters
        */
        recordRelationship(char1, char2, relationshipType, position, results) {
        const normalized1 = this.normalizeName(char1);
        const normalized2 = this.normalizeName(char2);
        
        if (normalized1 === normalized2) return;
        
        const key = ${normalized1}||${normalized2};
        const reverseKey = ${normalized2}||${normalized1};
        
        if (!results.relationships.has(key) && !results.relationships.has(reverseKey)) {
        results.relationships.set(key, {
        character1: normalized1,
        character2: normalized2,
        relationships: [],
        positions: []
        });
        }
        
        const relationshipKey = results.relationships.has(key) ? key : reverseKey;
        const relationship = results.relationships.get(relationshipKey);
        
        relationship.relationships.push(relationshipType);
        relationship.positions.push(position);
        }
        
        /**
        
        Process results and assign confidence levels
        */
        processResults(results) {
        // Process individual characters
        results.characters.forEach((character, name) => {
        // Calculate final confidence score
        let finalConfidence = character.confidence;
        
        // Boost confidence for multiple detection methods
        if (character.detectionMethods.size > 1) {
        finalConfidence = Math.min(1.0, finalConfidence * 1.2);
        }
        
        // Boost confidence for multiple mentions
        if (character.mentions.length > 1) {
        finalConfidence = Math.min(1.0, finalConfidence * (1 + (character.mentions.length * 0.1)));
        }
        
        // Assign to confidence categories
        if (finalConfidence >= 0.8) {
        results.confidence.high.push(character);
        } else if (finalConfidence >= 0.5) {
        results.confidence.medium.push(character);
        } else {
        results.confidence.low.push(character);
        }
        });
        
        // Process collectives
        results.collectives.forEach((collective, name) => {
        // Calculate final confidence score
        let finalConfidence = collective.confidence;
        
        // Boost confidence for multiple detection methods
        if (collective.detectionMethods.size > 1) {
          finalConfidence = Math.min(1.0, finalConfidence * 1.2);
        }
        
        // Boost confidence for multiple mentions
        if (collective.mentions.length > 1) {
          finalConfidence = Math.min(1.0, finalConfidence * (1 + (collective.mentions.length * 0.1)));
        }
        
        // Assign to confidence categories
        if (finalConfidence >= 0.8) {
          results.collectiveConfidence.high.push(collective);
        } else if (finalConfidence >= 0.5) {
          results.collectiveConfidence.medium.push(collective);
        } else {
          results.collectiveConfidence.low.push(collective);
        }
        });
        }
        
        /**
        
        NEW: Process relationships to consolidate and analyze them
        */
        processRelationships(relationships) {
        const processed = [];
        
        relationships.forEach(relationship => {
        // Count relationship types
        const typeCounts = {};
        relationship.relationships.forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        // Find most common relationship type
        let mostCommonType = '';
        let maxCount = 0;
        for (const type in typeCounts) {
          if (typeCounts[type] > maxCount) {
            mostCommonType = type;
            maxCount = typeCounts[type];
          }
        }
        
        processed.push({
          character1: relationship.character1,
          character2: relationship.character2,
          relationship: mostCommonType,
          strength: maxCount,
          positions: relationship.positions
        });
        });
        
        return processed;
        }
        
        /**
        
        NEW: Analyze character transitions from individual to collective
        */
        analyzeCharacterTransitions(results) {
        // Sort timeline by position
        results.timeline.sort((a, b) => a.position - b.position);
        
        // Track character appearances and group formations
        const characterAppearances = new Map();
        const groupFormations = [];
        
        results.timeline.forEach(event => {
        if (event.type === 'character') {
        if (!characterAppearances.has(event.name)) {
        characterAppearances.set(event.name, []);
        }
        characterAppearances.get(event.name).push(event);
        } else if (event.type === 'collective') {
        groupFormations.push(event);
        }
        });
        
        // Analyze how individual characters transition to group participation
        const transitions = [];
        
        groupFormations.forEach(groupEvent => {
        // Find characters mentioned before this group formation
        const priorCharacters = [];
        
        characterAppearances.forEach((appearances, name) => {
          const lastAppearance = appearances[appearances.length - 1];
          if (lastAppearance.position < groupEvent.position) {
            priorCharacters.push(name);
          }
        });
        
        if (priorCharacters.length > 0) {
          transitions.push({
            group: groupEvent.name,
            characters: priorCharacters,
            position: groupEvent.position,
            sectionIndex: groupEvent.sectionIndex
          });
        }
        });
        
        return transitions;
        }
        
        /**
        
        NEW: Identify character transitions from individual to collective
        */
        identifyCharacterTransitions(results) {
        const transitions = [];
        
        // Look for characters who are later part of collectives
        results.collectiveMentions.forEach(collectiveMention => {
        const collectiveName = collectiveMention.name;
        const collectiveText = collectiveMention.text;
        
        // Find individual characters mentioned in the collective text
        const individualChars = [];
        const nameMatches = [...collectiveText.matchAll(/([A-Z][a-z]+)/g)];
        nameMatches.forEach(match => {
          const name = match[0];
          if (results.characters.has(name)) {
            individualChars.push(name);
          }
        });
        
        if (individualChars.length > 0) {
          transitions.push({
            collective: collectiveName,
            characters: individualChars,
            position: collectiveMention.position,
            sectionIndex: collectiveMention.sectionIndex,
            context: collectiveText
          });
        }
        });
        
        return transitions;
        }
        
        /**
        
        Normalize character names for consistent comparison
        */
        normalizeName(name) {
        // Remove articles at beginning
        let normalized = name.replace(/^(the|a|an)\s+/i, '');
        
        // Convert to lowercase except first letter
        normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
        
        // Remove possessives
        normalized = normalized.replace(/'s$/, '');
        
        return normalized;
        }
        
        /**
        
        Check if a word is a common word (not likely a character name)
        */
        isCommonWord(word) {
        const commonWords = new Set([
        'I', 'A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At', 'By', 'In', 'Of', 'On', 'To', 'With','He', 'She', 'It', 'They', 'We', 'You'
        ]);
        
        return commonWords.has(word);
        }
        }
        
        // Export for use in other modules
        if (typeof module !== 'undefined' && module.exports) {
        module.exports = EnhancedCharacterDetector;
        }
        
export { EnhancedCharacterDetector };