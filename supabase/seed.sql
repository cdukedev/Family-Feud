-- =============================================================================
-- Family Feud Seed Data: 50 Questions with Answers
-- =============================================================================
-- Each question has 5-8 answers with point distributions summing to ~100.
-- Aliases cover synonyms, abbreviations, plurals, and common STT errors.
-- =============================================================================

-- Question 1: Travel
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something people forget to pack for vacation', 7, 'travel', 'medium', 'archive', true, ARRAY['travel', 'packing', 'vacation']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something people forget to pack for vacation')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Toothbrush', 35, ARRAY['tooth brush', 'toothbrushes', 'teeth brush']),
  ((SELECT id FROM q), 2, 'Phone Charger', 20, ARRAY['charger', 'cell charger', 'charging cable', 'phone cable', 'usb cable']),
  ((SELECT id FROM q), 3, 'Underwear', 15, ARRAY['undergarments', 'undies', 'boxers', 'briefs', 'panties']),
  ((SELECT id FROM q), 4, 'Sunscreen', 10, ARRAY['sun screen', 'sunblock', 'sun block', 'spf', 'sun lotion']),
  ((SELECT id FROM q), 5, 'Medicine', 8, ARRAY['medication', 'meds', 'prescriptions', 'pills', 'prescription']),
  ((SELECT id FROM q), 6, 'Socks', 7, ARRAY['sock', 'stockings']),
  ((SELECT id FROM q), 7, 'Pajamas', 5, ARRAY['pjs', 'pyjamas', 'pajama', 'sleepwear', 'nightwear']);

-- Question 2: Outdoors
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you bring on a camping trip', 7, 'outdoors', 'easy', 'archive', true, ARRAY['camping', 'outdoors', 'nature']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you bring on a camping trip')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Tent', 38, ARRAY['tents', 'camping tent']),
  ((SELECT id FROM q), 2, 'Food', 22, ARRAY['snacks', 'groceries', 'meals', 'provisions']),
  ((SELECT id FROM q), 3, 'Sleeping Bag', 15, ARRAY['sleeping bags', 'sleep bag', 'bedroll']),
  ((SELECT id FROM q), 4, 'Flashlight', 10, ARRAY['flash light', 'flashlights', 'torch', 'lantern', 'lamp']),
  ((SELECT id FROM q), 5, 'Bug Spray', 8, ARRAY['insect repellent', 'insect spray', 'mosquito spray', 'bug repellent', 'deet']),
  ((SELECT id FROM q), 6, 'Matches', 4, ARRAY['match', 'lighter', 'lighters', 'fire starter', 'firestarter']),
  ((SELECT id FROM q), 7, 'Cooler', 3, ARRAY['ice chest', 'ice box', 'icebox', 'coolers']);

-- Question 3: Work/Office
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name a reason people call in sick to work', 7, 'work', 'easy', 'archive', true, ARRAY['work', 'office', 'sick']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name a reason people call in sick to work')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Cold or Flu', 40, ARRAY['cold', 'flu', 'the flu', 'influenza', 'common cold', 'cold flu', 'a cold']),
  ((SELECT id FROM q), 2, 'Headache', 18, ARRAY['headaches', 'migraine', 'migraines', 'head ache']),
  ((SELECT id FROM q), 3, 'Stomach Bug', 15, ARRAY['stomach ache', 'stomachache', 'stomach flu', 'nausea', 'upset stomach', 'food poisoning', 'vomiting', 'throwing up']),
  ((SELECT id FROM q), 4, 'Doctor Appointment', 10, ARRAY['doctors appointment', 'doctor visit', 'medical appointment', 'dentist']),
  ((SELECT id FROM q), 5, 'Mental Health Day', 8, ARRAY['mental health', 'stress', 'anxiety', 'burnout', 'tired', 'exhaustion']),
  ((SELECT id FROM q), 6, 'Back Pain', 5, ARRAY['backache', 'back ache', 'sore back', 'bad back']),
  ((SELECT id FROM q), 7, 'Hangover', 4, ARRAY['hung over', 'hang over', 'too much to drink']);

-- Question 4: Food
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name a popular pizza topping', 7, 'food', 'easy', 'archive', true, ARRAY['food', 'pizza', 'toppings']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name a popular pizza topping')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Pepperoni', 40, ARRAY['peperoni', 'pepperonis', 'pepproni']),
  ((SELECT id FROM q), 2, 'Sausage', 18, ARRAY['italian sausage', 'sausages']),
  ((SELECT id FROM q), 3, 'Mushrooms', 13, ARRAY['mushroom', 'shrooms']),
  ((SELECT id FROM q), 4, 'Onions', 10, ARRAY['onion', 'red onion', 'red onions']),
  ((SELECT id FROM q), 5, 'Green Peppers', 8, ARRAY['peppers', 'bell peppers', 'bell pepper', 'green pepper']),
  ((SELECT id FROM q), 6, 'Olives', 6, ARRAY['olive', 'black olives', 'black olive']),
  ((SELECT id FROM q), 7, 'Pineapple', 5, ARRAY['pineapples', 'pine apple']);

-- Question 5: Family
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something parents say to their kids every day', 7, 'family', 'easy', 'archive', true, ARRAY['family', 'parents', 'kids']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something parents say to their kids every day')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'I Love You', 30, ARRAY['love you', 'i love u', 'luv you']),
  ((SELECT id FROM q), 2, 'Go To Bed', 20, ARRAY['go to sleep', 'bedtime', 'time for bed', 'its bedtime', 'get to bed']),
  ((SELECT id FROM q), 3, 'Clean Your Room', 15, ARRAY['clean up', 'tidy up', 'pick up your room', 'clean room', 'clean up your room']),
  ((SELECT id FROM q), 4, 'Do Your Homework', 12, ARRAY['homework', 'finish your homework', 'did you do your homework']),
  ((SELECT id FROM q), 5, 'Brush Your Teeth', 10, ARRAY['brush teeth', 'brushed your teeth']),
  ((SELECT id FROM q), 6, 'Be Careful', 8, ARRAY['be safe', 'stay safe', 'watch out', 'be cautious']),
  ((SELECT id FROM q), 7, 'Eat Your Vegetables', 5, ARRAY['eat your veggies', 'eat vegetables', 'eat your greens', 'finish your dinner']);

-- Question 6: Holidays
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you see at a Fourth of July celebration', 7, 'holidays', 'easy', 'archive', true, ARRAY['holidays', 'july fourth', 'celebration']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you see at a Fourth of July celebration')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Fireworks', 40, ARRAY['firework', 'fire works', 'firecrackers']),
  ((SELECT id FROM q), 2, 'American Flag', 20, ARRAY['flag', 'flags', 'us flag', 'american flags', 'the flag']),
  ((SELECT id FROM q), 3, 'BBQ', 15, ARRAY['barbecue', 'barbeque', 'grilling', 'grill', 'cookout', 'cook out']),
  ((SELECT id FROM q), 4, 'Hot Dogs', 8, ARRAY['hotdogs', 'hot dog', 'hotdog']),
  ((SELECT id FROM q), 5, 'Parade', 7, ARRAY['parades', 'a parade']),
  ((SELECT id FROM q), 6, 'Beer', 5, ARRAY['beers', 'drinks', 'alcohol', 'booze']),
  ((SELECT id FROM q), 7, 'Sparklers', 5, ARRAY['sparkler', 'a sparkler']);

-- Question 7: Sports
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name a sport that is fun to watch but hard to play', 6, 'sports', 'medium', 'archive', true, ARRAY['sports', 'athletics']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name a sport that is fun to watch but hard to play')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Football', 30, ARRAY['american football', 'nfl']),
  ((SELECT id FROM q), 2, 'Hockey', 22, ARRAY['ice hockey', 'nhl']),
  ((SELECT id FROM q), 3, 'Gymnastics', 18, ARRAY['gymnastic']),
  ((SELECT id FROM q), 4, 'Basketball', 13, ARRAY['nba', 'bball', 'b ball']),
  ((SELECT id FROM q), 5, 'Soccer', 10, ARRAY['football soccer', 'futbol', 'fútbol']),
  ((SELECT id FROM q), 6, 'Figure Skating', 7, ARRAY['ice skating', 'skating', 'ice skate']);

-- Question 8: Household
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something in your house that you forget to clean', 7, 'household', 'medium', 'archive', true, ARRAY['household', 'cleaning', 'home']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something in your house that you forget to clean')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Behind the Fridge', 28, ARRAY['fridge', 'refrigerator', 'behind refrigerator', 'back of fridge']),
  ((SELECT id FROM q), 2, 'Ceiling Fan', 20, ARRAY['ceiling fans', 'fan blades', 'fans']),
  ((SELECT id FROM q), 3, 'Baseboards', 15, ARRAY['baseboard', 'base boards', 'base board']),
  ((SELECT id FROM q), 4, 'Windows', 12, ARRAY['window', 'window sills', 'windowsill', 'windowsills']),
  ((SELECT id FROM q), 5, 'Under the Bed', 10, ARRAY['under bed', 'underneath the bed']),
  ((SELECT id FROM q), 6, 'Light Fixtures', 8, ARRAY['light fixture', 'lights', 'light switches', 'light switch']),
  ((SELECT id FROM q), 7, 'Oven', 7, ARRAY['stove', 'inside the oven', 'stovetop']);

-- Question 9: Animals
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name an animal you might see at the zoo', 8, 'animals', 'easy', 'archive', true, ARRAY['animals', 'zoo']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name an animal you might see at the zoo')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Lion', 25, ARRAY['lions', 'a lion']),
  ((SELECT id FROM q), 2, 'Elephant', 20, ARRAY['elephants', 'an elephant']),
  ((SELECT id FROM q), 3, 'Monkey', 15, ARRAY['monkeys', 'ape', 'apes', 'gorilla', 'gorillas', 'chimp', 'chimpanzee']),
  ((SELECT id FROM q), 4, 'Giraffe', 12, ARRAY['giraffes', 'a giraffe']),
  ((SELECT id FROM q), 5, 'Tiger', 10, ARRAY['tigers', 'a tiger']),
  ((SELECT id FROM q), 6, 'Bear', 8, ARRAY['bears', 'polar bear', 'grizzly bear', 'grizzly']),
  ((SELECT id FROM q), 7, 'Zebra', 5, ARRAY['zebras', 'a zebra']),
  ((SELECT id FROM q), 8, 'Snake', 5, ARRAY['snakes', 'a snake', 'serpent']);

-- Question 10: School
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name a subject in school that students dread', 6, 'school', 'easy', 'archive', true, ARRAY['school', 'education', 'students']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name a subject in school that students dread')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Math', 40, ARRAY['mathematics', 'maths', 'algebra', 'calculus', 'geometry']),
  ((SELECT id FROM q), 2, 'Science', 20, ARRAY['sciences', 'chemistry', 'physics', 'biology']),
  ((SELECT id FROM q), 3, 'History', 15, ARRAY['social studies', 'world history', 'us history']),
  ((SELECT id FROM q), 4, 'English', 10, ARRAY['language arts', 'writing', 'literature', 'reading']),
  ((SELECT id FROM q), 5, 'Gym', 8, ARRAY['physical education', 'pe', 'p.e.', 'phys ed']),
  ((SELECT id FROM q), 6, 'Foreign Language', 7, ARRAY['spanish', 'french', 'languages', 'foreign languages']);

-- Question 11: Health
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something a doctor tells you to do more of', 6, 'health', 'easy', 'archive', true, ARRAY['health', 'doctor', 'wellness']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something a doctor tells you to do more of')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Exercise', 35, ARRAY['work out', 'workout', 'working out', 'physical activity', 'move more']),
  ((SELECT id FROM q), 2, 'Drink Water', 25, ARRAY['water', 'hydrate', 'stay hydrated', 'drink more water']),
  ((SELECT id FROM q), 3, 'Sleep', 15, ARRAY['rest', 'get more sleep', 'sleep more']),
  ((SELECT id FROM q), 4, 'Eat Vegetables', 10, ARRAY['eat healthy', 'eat better', 'vegetables', 'fruits and vegetables', 'veggies']),
  ((SELECT id FROM q), 5, 'Relax', 8, ARRAY['reduce stress', 'de-stress', 'destress', 'less stress']),
  ((SELECT id FROM q), 6, 'Walk', 7, ARRAY['walking', 'go for walks', 'take walks']);

-- Question 12: Money
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something people waste money on', 7, 'money', 'medium', 'archive', true, ARRAY['money', 'spending', 'finance']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something people waste money on')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Fast Food', 25, ARRAY['eating out', 'restaurants', 'takeout', 'take out', 'dining out', 'junk food']),
  ((SELECT id FROM q), 2, 'Coffee', 20, ARRAY['starbucks', 'lattes', 'coffeeshop', 'coffee shop', 'espresso']),
  ((SELECT id FROM q), 3, 'Clothes', 15, ARRAY['clothing', 'shoes', 'fashion', 'designer clothes']),
  ((SELECT id FROM q), 4, 'Lottery Tickets', 12, ARRAY['lottery', 'lotto', 'scratch offs', 'scratchoffs', 'gambling']),
  ((SELECT id FROM q), 5, 'Subscriptions', 10, ARRAY['streaming services', 'streaming', 'subscription', 'netflix', 'memberships']),
  ((SELECT id FROM q), 6, 'Alcohol', 10, ARRAY['drinks', 'booze', 'beer', 'wine', 'liquor', 'drinking']),
  ((SELECT id FROM q), 7, 'Cigarettes', 8, ARRAY['smoking', 'tobacco', 'vaping', 'vape']);

-- Question 13: Relationships
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something that makes a great first date', 6, 'relationships', 'medium', 'archive', true, ARRAY['relationships', 'dating', 'romance']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something that makes a great first date')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Dinner', 35, ARRAY['restaurant', 'going to dinner', 'nice dinner', 'eating out']),
  ((SELECT id FROM q), 2, 'Movie', 25, ARRAY['movies', 'the movies', 'a movie', 'cinema', 'film']),
  ((SELECT id FROM q), 3, 'Coffee', 15, ARRAY['coffee date', 'coffee shop', 'cafe', 'getting coffee']),
  ((SELECT id FROM q), 4, 'Walk in the Park', 10, ARRAY['walk', 'park', 'walking', 'hike', 'hiking']),
  ((SELECT id FROM q), 5, 'Bowling', 8, ARRAY['bowling alley', 'go bowling']),
  ((SELECT id FROM q), 6, 'Concert', 7, ARRAY['music', 'live music', 'show', 'a concert']);

-- Question 14: Technology
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you do on your phone every day', 7, 'technology', 'easy', 'archive', true, ARRAY['technology', 'phone', 'daily']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you do on your phone every day')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Text', 28, ARRAY['texting', 'send texts', 'text messages', 'messaging', 'text message']),
  ((SELECT id FROM q), 2, 'Social Media', 22, ARRAY['check social media', 'facebook', 'instagram', 'tiktok', 'twitter', 'scroll']),
  ((SELECT id FROM q), 3, 'Make Calls', 18, ARRAY['call', 'phone calls', 'calling', 'make a call', 'talk on the phone']),
  ((SELECT id FROM q), 4, 'Check Email', 12, ARRAY['email', 'emails', 'read email', 'e-mail']),
  ((SELECT id FROM q), 5, 'Play Games', 8, ARRAY['games', 'gaming', 'play a game', 'mobile games']),
  ((SELECT id FROM q), 6, 'Watch Videos', 7, ARRAY['youtube', 'watch youtube', 'videos', 'tiktok videos', 'streaming']),
  ((SELECT id FROM q), 7, 'Set Alarm', 5, ARRAY['alarm', 'alarm clock', 'alarms', 'set an alarm']);

-- Question 15: Cars
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something annoying that happens while driving', 7, 'cars', 'medium', 'archive', true, ARRAY['cars', 'driving', 'traffic']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something annoying that happens while driving')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Traffic', 30, ARRAY['traffic jam', 'heavy traffic', 'gridlock', 'stuck in traffic']),
  ((SELECT id FROM q), 2, 'Getting Cut Off', 20, ARRAY['cut off', 'someone cuts you off', 'being cut off']),
  ((SELECT id FROM q), 3, 'Red Lights', 15, ARRAY['red light', 'stop lights', 'hitting every red light', 'traffic lights']),
  ((SELECT id FROM q), 4, 'Tailgaters', 12, ARRAY['tailgating', 'tailgater', 'someone tailgating']),
  ((SELECT id FROM q), 5, 'Road Construction', 10, ARRAY['construction', 'detour', 'detours', 'road work']),
  ((SELECT id FROM q), 6, 'No Parking', 7, ARRAY['finding parking', 'parking', 'cant find parking']),
  ((SELECT id FROM q), 7, 'Flat Tire', 6, ARRAY['flat', 'blowout', 'tire blowout', 'tire puncture']);

-- Question 16: Weather
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you do when it rains', 6, 'weather', 'easy', 'archive', true, ARRAY['weather', 'rain', 'indoor']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you do when it rains')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Stay Inside', 30, ARRAY['stay home', 'stay indoors', 'go inside', 'stay in']),
  ((SELECT id FROM q), 2, 'Watch TV', 25, ARRAY['watch television', 'watch a movie', 'watch movies', 'binge watch', 'netflix']),
  ((SELECT id FROM q), 3, 'Sleep', 18, ARRAY['nap', 'take a nap', 'napping', 'go to sleep']),
  ((SELECT id FROM q), 4, 'Read', 12, ARRAY['read a book', 'reading']),
  ((SELECT id FROM q), 5, 'Use an Umbrella', 8, ARRAY['umbrella', 'grab an umbrella', 'open umbrella']),
  ((SELECT id FROM q), 6, 'Play Board Games', 7, ARRAY['board games', 'play games', 'card games', 'puzzles']);

-- Question 17: Clothing
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name a piece of clothing that is uncomfortable', 6, 'clothing', 'medium', 'archive', true, ARRAY['clothing', 'fashion', 'comfort']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name a piece of clothing that is uncomfortable')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'High Heels', 30, ARRAY['heels', 'high heel', 'stilettos', 'stiletto']),
  ((SELECT id FROM q), 2, 'Tie', 22, ARRAY['necktie', 'neck tie', 'ties', 'bow tie', 'bowtie']),
  ((SELECT id FROM q), 3, 'Skinny Jeans', 18, ARRAY['tight jeans', 'tight pants', 'skinny jean']),
  ((SELECT id FROM q), 4, 'Bra', 12, ARRAY['bras', 'underwire bra', 'strapless bra']),
  ((SELECT id FROM q), 5, 'Suit', 10, ARRAY['suits', 'a suit', 'business suit', 'tuxedo', 'tux']),
  ((SELECT id FROM q), 6, 'Corset', 8, ARRAY['corsets', 'girdle', 'shapewear']);

-- Question 18: Food
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name a food people eat at a barbecue', 7, 'food', 'easy', 'archive', true, ARRAY['food', 'bbq', 'summer']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name a food people eat at a barbecue')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Hamburgers', 30, ARRAY['burgers', 'burger', 'hamburger', 'cheeseburger', 'cheeseburgers']),
  ((SELECT id FROM q), 2, 'Hot Dogs', 25, ARRAY['hotdogs', 'hot dog', 'hotdog', 'franks', 'frankfurters']),
  ((SELECT id FROM q), 3, 'Ribs', 15, ARRAY['bbq ribs', 'barbecue ribs', 'spare ribs', 'baby back ribs']),
  ((SELECT id FROM q), 4, 'Corn on the Cob', 10, ARRAY['corn', 'corn cob', 'grilled corn']),
  ((SELECT id FROM q), 5, 'Potato Salad', 8, ARRAY['potatoes', 'potato', 'coleslaw', 'cole slaw']),
  ((SELECT id FROM q), 6, 'Chicken', 7, ARRAY['grilled chicken', 'bbq chicken', 'chicken wings', 'wings']),
  ((SELECT id FROM q), 7, 'Watermelon', 5, ARRAY['water melon', 'melon', 'fruit']);

-- Question 19: Work/Office
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you find in every office', 7, 'work', 'easy', 'archive', true, ARRAY['work', 'office', 'supplies']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you find in every office')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Computer', 30, ARRAY['computers', 'laptop', 'laptops', 'pc', 'desktop']),
  ((SELECT id FROM q), 2, 'Desk', 20, ARRAY['desks', 'a desk', 'table']),
  ((SELECT id FROM q), 3, 'Printer', 15, ARRAY['printers', 'copy machine', 'copier']),
  ((SELECT id FROM q), 4, 'Phone', 10, ARRAY['telephone', 'phones', 'telephones']),
  ((SELECT id FROM q), 5, 'Pens', 8, ARRAY['pen', 'pencils', 'pencil', 'writing utensils']),
  ((SELECT id FROM q), 6, 'Paper', 10, ARRAY['papers', 'printer paper', 'copy paper']),
  ((SELECT id FROM q), 7, 'Coffee Maker', 7, ARRAY['coffee machine', 'coffee pot', 'keurig', 'coffee']);

-- Question 20: Family
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something families argue about on road trips', 7, 'family', 'medium', 'archive', true, ARRAY['family', 'travel', 'road trip']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something families argue about on road trips')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Music', 25, ARRAY['radio', 'what to listen to', 'radio station', 'the radio', 'songs']),
  ((SELECT id FROM q), 2, 'Where to Eat', 22, ARRAY['food', 'restaurants', 'where to stop for food', 'what to eat']),
  ((SELECT id FROM q), 3, 'Directions', 18, ARRAY['getting lost', 'navigation', 'which way to go', 'the map', 'gps']),
  ((SELECT id FROM q), 4, 'Who Sits Where', 10, ARRAY['seating', 'seats', 'who sits in front', 'shotgun']),
  ((SELECT id FROM q), 5, 'Temperature', 10, ARRAY['ac', 'air conditioning', 'too hot', 'too cold', 'thermostat']),
  ((SELECT id FROM q), 6, 'Bathroom Stops', 8, ARRAY['bathroom breaks', 'rest stops', 'stopping', 'pulling over']),
  ((SELECT id FROM q), 7, 'Screen Time', 7, ARRAY['phones', 'devices', 'tablets', 'ipad', 'electronics']);

-- Question 21: Food
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name a breakfast food everyone loves', 7, 'food', 'easy', 'archive', true, ARRAY['food', 'breakfast', 'morning']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name a breakfast food everyone loves')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Bacon', 30, ARRAY['bakon', 'turkey bacon']),
  ((SELECT id FROM q), 2, 'Pancakes', 22, ARRAY['pancake', 'flapjacks', 'hotcakes', 'hot cakes']),
  ((SELECT id FROM q), 3, 'Eggs', 18, ARRAY['egg', 'scrambled eggs', 'fried eggs', 'omelette', 'omelet']),
  ((SELECT id FROM q), 4, 'Waffles', 10, ARRAY['waffle', 'belgian waffles']),
  ((SELECT id FROM q), 5, 'Cereal', 8, ARRAY['cereals', 'bowl of cereal']),
  ((SELECT id FROM q), 6, 'Toast', 7, ARRAY['bread', 'french toast', 'buttered toast']),
  ((SELECT id FROM q), 7, 'Sausage', 5, ARRAY['sausages', 'breakfast sausage', 'sausage links', 'sausage patties']);

-- Question 22: Holidays
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you put on a Christmas tree', 7, 'holidays', 'easy', 'archive', true, ARRAY['holidays', 'christmas', 'decorations']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you put on a Christmas tree')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Ornaments', 30, ARRAY['ornament', 'balls', 'decorations', 'baubles']),
  ((SELECT id FROM q), 2, 'Lights', 25, ARRAY['christmas lights', 'string lights', 'light', 'twinkle lights']),
  ((SELECT id FROM q), 3, 'Star', 15, ARRAY['a star', 'tree topper', 'angel', 'star on top']),
  ((SELECT id FROM q), 4, 'Tinsel', 10, ARRAY['garland', 'tinsel garland']),
  ((SELECT id FROM q), 5, 'Candy Canes', 8, ARRAY['candy cane', 'candycane', 'candycanes']),
  ((SELECT id FROM q), 6, 'Ribbon', 7, ARRAY['ribbons', 'bows', 'bow']),
  ((SELECT id FROM q), 7, 'Tree Skirt', 5, ARRAY['skirt', 'treeskirt']);

-- Question 23: Sports
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you need to play baseball', 6, 'sports', 'easy', 'archive', true, ARRAY['sports', 'baseball']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you need to play baseball')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Bat', 30, ARRAY['baseball bat', 'bats']),
  ((SELECT id FROM q), 2, 'Ball', 25, ARRAY['baseball', 'baseballs', 'a ball']),
  ((SELECT id FROM q), 3, 'Glove', 20, ARRAY['mitt', 'baseball glove', 'baseball mitt', 'gloves']),
  ((SELECT id FROM q), 4, 'Helmet', 10, ARRAY['batting helmet', 'helmets']),
  ((SELECT id FROM q), 5, 'Bases', 8, ARRAY['base', 'the bases']),
  ((SELECT id FROM q), 6, 'Cleats', 7, ARRAY['shoes', 'baseball cleats', 'cleat', 'spikes']);

-- Question 24: Household
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name an appliance that makes a lot of noise', 6, 'household', 'easy', 'archive', true, ARRAY['household', 'appliances', 'noise']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name an appliance that makes a lot of noise')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Blender', 30, ARRAY['blenders', 'a blender']),
  ((SELECT id FROM q), 2, 'Vacuum', 25, ARRAY['vacuum cleaner', 'hoover', 'vacuums']),
  ((SELECT id FROM q), 3, 'Washing Machine', 15, ARRAY['washer', 'laundry machine', 'clothes washer']),
  ((SELECT id FROM q), 4, 'Dishwasher', 12, ARRAY['dish washer', 'dishwashers']),
  ((SELECT id FROM q), 5, 'Dryer', 10, ARRAY['clothes dryer', 'the dryer']),
  ((SELECT id FROM q), 6, 'Garbage Disposal', 8, ARRAY['disposal', 'trash disposal']);

-- Question 25: Travel
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name a place people dream of visiting', 7, 'travel', 'easy', 'archive', true, ARRAY['travel', 'vacation', 'destinations']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name a place people dream of visiting')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Hawaii', 28, ARRAY['hawai', 'the hawaiian islands', 'maui']),
  ((SELECT id FROM q), 2, 'Paris', 22, ARRAY['france', 'paris france']),
  ((SELECT id FROM q), 3, 'Italy', 15, ARRAY['rome', 'venice', 'italian']),
  ((SELECT id FROM q), 4, 'Caribbean', 12, ARRAY['caribbean islands', 'bahamas', 'jamaica', 'tropical island']),
  ((SELECT id FROM q), 5, 'Australia', 8, ARRAY['down under', 'sydney']),
  ((SELECT id FROM q), 6, 'Japan', 7, ARRAY['tokyo', 'japanese']),
  ((SELECT id FROM q), 7, 'London', 8, ARRAY['england', 'united kingdom', 'uk', 'britain']);

-- Question 26: Food
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name a food that is messy to eat', 7, 'food', 'easy', 'archive', true, ARRAY['food', 'messy', 'eating']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name a food that is messy to eat')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Ribs', 28, ARRAY['bbq ribs', 'spare ribs', 'baby back ribs', 'barbecue ribs']),
  ((SELECT id FROM q), 2, 'Spaghetti', 22, ARRAY['pasta', 'noodles', 'spaghetti and meatballs']),
  ((SELECT id FROM q), 3, 'Wings', 15, ARRAY['chicken wings', 'buffalo wings', 'hot wings', 'wing']),
  ((SELECT id FROM q), 4, 'Tacos', 12, ARRAY['taco', 'a taco']),
  ((SELECT id FROM q), 5, 'Watermelon', 10, ARRAY['water melon', 'melon']),
  ((SELECT id FROM q), 6, 'Ice Cream', 8, ARRAY['icecream', 'ice cream cone', 'cone']),
  ((SELECT id FROM q), 7, 'Corn on the Cob', 5, ARRAY['corn', 'corn cob', 'cob of corn']);

-- Question 27: Technology
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something that needs to be charged', 7, 'technology', 'easy', 'archive', true, ARRAY['technology', 'electronics', 'battery']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something that needs to be charged')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Phone', 35, ARRAY['cell phone', 'cellphone', 'mobile phone', 'smartphone', 'iphone', 'android']),
  ((SELECT id FROM q), 2, 'Laptop', 20, ARRAY['computer', 'laptop computer', 'notebook']),
  ((SELECT id FROM q), 3, 'Tablet', 12, ARRAY['ipad', 'tablets', 'kindle']),
  ((SELECT id FROM q), 4, 'Smartwatch', 10, ARRAY['watch', 'apple watch', 'smart watch', 'fitbit']),
  ((SELECT id FROM q), 5, 'Earbuds', 8, ARRAY['headphones', 'airpods', 'earphones', 'ear buds']),
  ((SELECT id FROM q), 6, 'Electric Car', 8, ARRAY['ev', 'tesla', 'electric vehicle']),
  ((SELECT id FROM q), 7, 'Game Controller', 7, ARRAY['controller', 'gaming controller', 'remote']);

-- Question 28: Money
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something people save up to buy', 7, 'money', 'medium', 'archive', true, ARRAY['money', 'saving', 'purchases']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something people save up to buy')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'House', 30, ARRAY['a house', 'home', 'a home']),
  ((SELECT id FROM q), 2, 'Car', 25, ARRAY['a car', 'vehicle', 'new car', 'automobile']),
  ((SELECT id FROM q), 3, 'Vacation', 15, ARRAY['trip', 'a vacation', 'travel', 'holiday']),
  ((SELECT id FROM q), 4, 'Phone', 10, ARRAY['new phone', 'iphone', 'smartphone', 'cell phone']),
  ((SELECT id FROM q), 5, 'TV', 8, ARRAY['television', 'big screen', 'flat screen']),
  ((SELECT id FROM q), 6, 'Engagement Ring', 7, ARRAY['ring', 'diamond ring', 'wedding ring']),
  ((SELECT id FROM q), 7, 'Computer', 5, ARRAY['laptop', 'pc', 'gaming computer', 'gaming pc']);

-- Question 29: Animals
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name a pet that is low maintenance', 6, 'animals', 'medium', 'archive', true, ARRAY['animals', 'pets']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name a pet that is low maintenance')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Fish', 35, ARRAY['goldfish', 'fishes', 'a fish', 'betta', 'betta fish']),
  ((SELECT id FROM q), 2, 'Cat', 25, ARRAY['cats', 'a cat', 'kitten', 'kitty']),
  ((SELECT id FROM q), 3, 'Hamster', 15, ARRAY['hamsters', 'a hamster', 'gerbil']),
  ((SELECT id FROM q), 4, 'Turtle', 10, ARRAY['turtles', 'tortoise', 'a turtle']),
  ((SELECT id FROM q), 5, 'Snake', 8, ARRAY['snakes', 'a snake', 'reptile']),
  ((SELECT id FROM q), 6, 'Hermit Crab', 7, ARRAY['hermit crabs', 'crab', 'crabs']);

-- Question 30: Household
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you keep in your junk drawer', 7, 'household', 'medium', 'archive', true, ARRAY['household', 'home', 'organization']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you keep in your junk drawer')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Batteries', 25, ARRAY['battery', 'a battery']),
  ((SELECT id FROM q), 2, 'Tape', 15, ARRAY['scotch tape', 'duct tape', 'masking tape', 'packing tape']),
  ((SELECT id FROM q), 3, 'Scissors', 15, ARRAY['scissor', 'a pair of scissors']),
  ((SELECT id FROM q), 4, 'Pens', 13, ARRAY['pen', 'pencils', 'pencil', 'markers']),
  ((SELECT id FROM q), 5, 'Rubber Bands', 12, ARRAY['rubber band', 'rubberband', 'rubberbands']),
  ((SELECT id FROM q), 6, 'Old Keys', 10, ARRAY['keys', 'key', 'random keys', 'spare keys']),
  ((SELECT id FROM q), 7, 'Coupons', 10, ARRAY['coupon', 'menus', 'takeout menus', 'flyers']);

-- Question 31: School
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something kids bring home from school', 6, 'school', 'easy', 'archive', true, ARRAY['school', 'kids', 'education']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something kids bring home from school')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Homework', 35, ARRAY['home work', 'assignments', 'schoolwork']),
  ((SELECT id FROM q), 2, 'Germs', 20, ARRAY['a cold', 'sickness', 'illness', 'sick', 'lice', 'bugs']),
  ((SELECT id FROM q), 3, 'Art Projects', 15, ARRAY['art', 'artwork', 'drawings', 'crafts', 'paintings']),
  ((SELECT id FROM q), 4, 'Report Card', 12, ARRAY['grades', 'report cards', 'progress report']),
  ((SELECT id FROM q), 5, 'Permission Slips', 10, ARRAY['forms', 'papers', 'notes', 'flyers', 'permission slip']),
  ((SELECT id FROM q), 6, 'Backpack', 8, ARRAY['bookbag', 'book bag', 'back pack', 'school bag']);

-- Question 32: Food
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name a food you eat with ketchup', 6, 'food', 'easy', 'archive', true, ARRAY['food', 'condiments']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name a food you eat with ketchup')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'French Fries', 38, ARRAY['fries', 'fry', 'french fry', 'chips']),
  ((SELECT id FROM q), 2, 'Hamburger', 22, ARRAY['burger', 'burgers', 'hamburgers', 'cheeseburger']),
  ((SELECT id FROM q), 3, 'Hot Dog', 15, ARRAY['hotdog', 'hot dogs', 'hotdogs']),
  ((SELECT id FROM q), 4, 'Eggs', 10, ARRAY['egg', 'scrambled eggs', 'fried egg']),
  ((SELECT id FROM q), 5, 'Chicken Nuggets', 8, ARRAY['nuggets', 'chicken tenders', 'tenders', 'chicken fingers']),
  ((SELECT id FROM q), 6, 'Meatloaf', 7, ARRAY['meat loaf']);

-- Question 33: Work/Office
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something people do to pass time at a boring meeting', 6, 'work', 'medium', 'archive', true, ARRAY['work', 'office', 'meetings']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something people do to pass time at a boring meeting')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Doodle', 30, ARRAY['draw', 'drawing', 'doodling', 'sketch']),
  ((SELECT id FROM q), 2, 'Check Phone', 25, ARRAY['look at phone', 'phone', 'scroll phone', 'text', 'texting']),
  ((SELECT id FROM q), 3, 'Daydream', 15, ARRAY['zone out', 'space out', 'daydreaming', 'stare into space']),
  ((SELECT id FROM q), 4, 'Fall Asleep', 12, ARRAY['sleep', 'doze off', 'nod off', 'nap']),
  ((SELECT id FROM q), 5, 'Take Notes', 10, ARRAY['write notes', 'notes', 'pretend to take notes']),
  ((SELECT id FROM q), 6, 'Drink Coffee', 8, ARRAY['coffee', 'sip coffee', 'drink water']);

-- Question 34: Relationships
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something couples fight about', 7, 'relationships', 'medium', 'archive', true, ARRAY['relationships', 'couples', 'arguments']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something couples fight about')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Money', 30, ARRAY['finances', 'bills', 'spending', 'budget']),
  ((SELECT id FROM q), 2, 'Chores', 20, ARRAY['housework', 'cleaning', 'who does what', 'dishes']),
  ((SELECT id FROM q), 3, 'Kids', 15, ARRAY['children', 'parenting', 'the kids']),
  ((SELECT id FROM q), 4, 'In-Laws', 10, ARRAY['family', 'parents', 'mother in law', 'in laws']),
  ((SELECT id FROM q), 5, 'Where to Eat', 10, ARRAY['food', 'dinner', 'what to eat', 'restaurant']),
  ((SELECT id FROM q), 6, 'TV Remote', 8, ARRAY['remote', 'what to watch', 'remote control', 'tv']),
  ((SELECT id FROM q), 7, 'Time Together', 7, ARRAY['quality time', 'not enough time', 'spending time', 'attention']);

-- Question 35: Health
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something people do to try to lose weight', 7, 'health', 'easy', 'archive', true, ARRAY['health', 'fitness', 'diet']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something people do to try to lose weight')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Diet', 28, ARRAY['go on a diet', 'dieting', 'eat less', 'eat healthy', 'count calories']),
  ((SELECT id FROM q), 2, 'Exercise', 25, ARRAY['work out', 'workout', 'go to the gym', 'gym', 'run', 'running']),
  ((SELECT id FROM q), 3, 'Walk', 15, ARRAY['walking', 'go for walks', 'take walks', 'jog', 'jogging']),
  ((SELECT id FROM q), 4, 'Cut Out Sugar', 10, ARRAY['no sugar', 'quit sugar', 'less sugar', 'cut carbs', 'low carb']),
  ((SELECT id FROM q), 5, 'Drink Water', 8, ARRAY['water', 'more water', 'hydrate']),
  ((SELECT id FROM q), 6, 'Skip Meals', 7, ARRAY['intermittent fasting', 'fasting', 'fast', 'skip lunch', 'starve']),
  ((SELECT id FROM q), 7, 'Take Supplements', 7, ARRAY['pills', 'diet pills', 'vitamins', 'supplements']);

-- Question 36: Holidays
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you do on Halloween', 7, 'holidays', 'easy', 'archive', true, ARRAY['holidays', 'halloween', 'costumes']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you do on Halloween')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Trick or Treat', 35, ARRAY['trick-or-treat', 'go trick or treating', 'trick or treating', 'trickortreat']),
  ((SELECT id FROM q), 2, 'Wear a Costume', 20, ARRAY['costume', 'dress up', 'costumes', 'wear costumes']),
  ((SELECT id FROM q), 3, 'Carve Pumpkins', 15, ARRAY['carve a pumpkin', 'pumpkin carving', 'jack o lantern', 'jack-o-lantern']),
  ((SELECT id FROM q), 4, 'Eat Candy', 10, ARRAY['candy', 'chocolate', 'sweets', 'eat sweets']),
  ((SELECT id FROM q), 5, 'Watch Scary Movies', 8, ARRAY['horror movies', 'scary movies', 'watch horror', 'scary movie']),
  ((SELECT id FROM q), 6, 'Go to a Party', 7, ARRAY['party', 'halloween party', 'costume party']),
  ((SELECT id FROM q), 7, 'Decorate', 5, ARRAY['decorations', 'decorate house', 'put up decorations']);

-- Question 37: Cars
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you keep in your car', 7, 'cars', 'easy', 'archive', true, ARRAY['cars', 'automobile', 'driving']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you keep in your car')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Phone Charger', 25, ARRAY['charger', 'car charger', 'charging cable']),
  ((SELECT id FROM q), 2, 'Registration', 20, ARRAY['insurance', 'registration and insurance', 'car registration', 'insurance papers']),
  ((SELECT id FROM q), 3, 'Sunglasses', 15, ARRAY['shades', 'sun glasses', 'sunglass']),
  ((SELECT id FROM q), 4, 'Napkins', 12, ARRAY['tissues', 'tissue', 'paper towels', 'napkin']),
  ((SELECT id FROM q), 5, 'Water Bottle', 10, ARRAY['water', 'drinks', 'beverages', 'a drink']),
  ((SELECT id FROM q), 6, 'Spare Tire', 10, ARRAY['jack', 'tire iron', 'jumper cables', 'emergency kit']),
  ((SELECT id FROM q), 7, 'Trash', 8, ARRAY['garbage', 'junk', 'receipts', 'wrappers']);

-- Question 38: Food
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name a flavor of ice cream', 7, 'food', 'easy', 'archive', true, ARRAY['food', 'dessert', 'ice cream']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name a flavor of ice cream')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Chocolate', 30, ARRAY['choclate', 'chocolate chip', 'double chocolate']),
  ((SELECT id FROM q), 2, 'Vanilla', 25, ARRAY['vanila', 'french vanilla']),
  ((SELECT id FROM q), 3, 'Strawberry', 15, ARRAY['strawberries', 'strawberries and cream']),
  ((SELECT id FROM q), 4, 'Cookies and Cream', 10, ARRAY['cookies n cream', 'oreo', 'cookies & cream', 'cookie and cream']),
  ((SELECT id FROM q), 5, 'Mint Chocolate Chip', 8, ARRAY['mint', 'mint chip', 'mint choc chip']),
  ((SELECT id FROM q), 6, 'Cookie Dough', 7, ARRAY['chocolate chip cookie dough', 'raw cookie dough']),
  ((SELECT id FROM q), 7, 'Rocky Road', 5, ARRAY['rockyroad']);

-- Question 39: Weather
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you do on a snow day', 6, 'weather', 'easy', 'archive', true, ARRAY['weather', 'winter', 'snow']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you do on a snow day')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Build a Snowman', 28, ARRAY['snowman', 'make a snowman', 'build snowman']),
  ((SELECT id FROM q), 2, 'Sledding', 22, ARRAY['sled', 'go sledding', 'toboggan', 'tobogganing']),
  ((SELECT id FROM q), 3, 'Sleep In', 18, ARRAY['sleep', 'stay in bed', 'sleep late', 'nap']),
  ((SELECT id FROM q), 4, 'Snowball Fight', 12, ARRAY['throw snowballs', 'snowball', 'snowballs']),
  ((SELECT id FROM q), 5, 'Drink Hot Chocolate', 12, ARRAY['hot chocolate', 'hot cocoa', 'cocoa', 'hot coco']),
  ((SELECT id FROM q), 6, 'Watch TV', 8, ARRAY['watch movies', 'tv', 'television', 'netflix']);

-- Question 40: Family
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you do at a family reunion', 6, 'family', 'medium', 'archive', true, ARRAY['family', 'reunion', 'gathering']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you do at a family reunion')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Eat', 30, ARRAY['food', 'eating', 'have a meal', 'eat food', 'dinner']),
  ((SELECT id FROM q), 2, 'Catch Up', 25, ARRAY['talk', 'chat', 'socialize', 'visit', 'gossip', 'reminisce']),
  ((SELECT id FROM q), 3, 'Play Games', 15, ARRAY['games', 'play sports', 'horseshoes', 'cornhole']),
  ((SELECT id FROM q), 4, 'Take Photos', 12, ARRAY['pictures', 'photos', 'take pictures', 'photograph']),
  ((SELECT id FROM q), 5, 'BBQ', 10, ARRAY['barbecue', 'grill', 'grilling', 'cookout']),
  ((SELECT id FROM q), 6, 'Hug', 8, ARRAY['hugging', 'hugs', 'embrace']);

-- Question 41: Outdoors
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you find at the beach', 8, 'outdoors', 'easy', 'archive', true, ARRAY['outdoors', 'beach', 'summer']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you find at the beach')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Sand', 25, ARRAY['the sand']),
  ((SELECT id FROM q), 2, 'Shells', 20, ARRAY['seashells', 'shell', 'seashell', 'sea shells']),
  ((SELECT id FROM q), 3, 'Waves', 15, ARRAY['ocean waves', 'water', 'ocean']),
  ((SELECT id FROM q), 4, 'Seagulls', 10, ARRAY['seagull', 'birds', 'sea gulls', 'gulls']),
  ((SELECT id FROM q), 5, 'Towels', 8, ARRAY['towel', 'beach towel', 'beach towels']),
  ((SELECT id FROM q), 6, 'Sunscreen', 7, ARRAY['sunblock', 'sun screen', 'spf']),
  ((SELECT id FROM q), 7, 'Crabs', 8, ARRAY['crab', 'hermit crab', 'hermit crabs']),
  ((SELECT id FROM q), 8, 'Umbrellas', 7, ARRAY['umbrella', 'beach umbrella', 'beach umbrellas']);

-- Question 42: Food
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you put in a sandwich', 7, 'food', 'easy', 'archive', true, ARRAY['food', 'lunch', 'sandwich']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you put in a sandwich')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Meat', 28, ARRAY['turkey', 'ham', 'roast beef', 'deli meat', 'salami', 'bologna']),
  ((SELECT id FROM q), 2, 'Cheese', 22, ARRAY['cheddar', 'swiss', 'american cheese', 'provolone']),
  ((SELECT id FROM q), 3, 'Lettuce', 15, ARRAY['greens', 'spinach', 'arugula']),
  ((SELECT id FROM q), 4, 'Tomato', 12, ARRAY['tomatoes', 'tomatos']),
  ((SELECT id FROM q), 5, 'Mustard', 8, ARRAY['yellow mustard', 'dijon']),
  ((SELECT id FROM q), 6, 'Mayonnaise', 8, ARRAY['mayo', 'miracle whip']),
  ((SELECT id FROM q), 7, 'Pickles', 7, ARRAY['pickle', 'a pickle']);

-- Question 43: Technology
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something that frustrates people about technology', 6, 'technology', 'medium', 'archive', true, ARRAY['technology', 'computers', 'frustration']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something that frustrates people about technology')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Slow Internet', 30, ARRAY['slow wifi', 'bad wifi', 'lag', 'buffering', 'slow connection', 'internet']),
  ((SELECT id FROM q), 2, 'Crashing', 22, ARRAY['crashes', 'freezing', 'frozen', 'computer crash', 'blue screen']),
  ((SELECT id FROM q), 3, 'Updates', 15, ARRAY['software updates', 'update', 'constant updates', 'forced updates']),
  ((SELECT id FROM q), 4, 'Passwords', 13, ARRAY['forgotten passwords', 'password', 'forgot password', 'too many passwords']),
  ((SELECT id FROM q), 5, 'Battery Life', 12, ARRAY['dead battery', 'battery dies', 'battery', 'low battery']),
  ((SELECT id FROM q), 6, 'Pop-Up Ads', 8, ARRAY['ads', 'pop ups', 'pop-ups', 'advertisements', 'spam']);

-- Question 44: Sports
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something you eat at a baseball game', 7, 'sports', 'easy', 'archive', true, ARRAY['sports', 'baseball', 'food']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something you eat at a baseball game')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Hot Dog', 35, ARRAY['hotdog', 'hot dogs', 'hotdogs', 'frank', 'frankfurter']),
  ((SELECT id FROM q), 2, 'Peanuts', 20, ARRAY['peanut', 'nuts']),
  ((SELECT id FROM q), 3, 'Nachos', 12, ARRAY['nacho', 'nachos and cheese', 'chips and cheese']),
  ((SELECT id FROM q), 4, 'Popcorn', 10, ARRAY['pop corn', 'a bag of popcorn']),
  ((SELECT id FROM q), 5, 'Cracker Jacks', 8, ARRAY['crackerjacks', 'cracker jack', 'crackerjack']),
  ((SELECT id FROM q), 6, 'Hamburger', 8, ARRAY['burger', 'burgers', 'cheeseburger']),
  ((SELECT id FROM q), 7, 'Cotton Candy', 7, ARRAY['cotton candy', 'candy']);

-- Question 45: Household
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something that wakes you up in the middle of the night', 7, 'household', 'medium', 'archive', true, ARRAY['household', 'sleep', 'night']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something that wakes you up in the middle of the night')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Noise', 25, ARRAY['loud noise', 'sounds', 'a noise', 'strange noise']),
  ((SELECT id FROM q), 2, 'Bathroom', 22, ARRAY['need to pee', 'gotta go', 'nature calling', 'use the bathroom', 'restroom']),
  ((SELECT id FROM q), 3, 'Kids', 15, ARRAY['children', 'baby', 'crying baby', 'baby crying', 'the kids']),
  ((SELECT id FROM q), 4, 'Bad Dream', 12, ARRAY['nightmare', 'nightmares', 'bad dreams']),
  ((SELECT id FROM q), 5, 'Phone', 10, ARRAY['phone ringing', 'text message', 'notification', 'phone call']),
  ((SELECT id FROM q), 6, 'Pet', 8, ARRAY['dog', 'cat', 'dog barking', 'pets']),
  ((SELECT id FROM q), 7, 'Thunder', 8, ARRAY['storm', 'thunderstorm', 'lightning', 'storms']);

-- Question 46: Travel
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something annoying about flying on an airplane', 7, 'travel', 'medium', 'archive', true, ARRAY['travel', 'airplane', 'flying']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something annoying about flying on an airplane')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Cramped Seats', 28, ARRAY['small seats', 'no legroom', 'leg room', 'tight seats', 'no leg room', 'seat size']),
  ((SELECT id FROM q), 2, 'Delays', 20, ARRAY['flight delays', 'delayed', 'cancellations', 'cancelled flights']),
  ((SELECT id FROM q), 3, 'Crying Babies', 15, ARRAY['babies', 'baby crying', 'kids', 'screaming kids', 'crying baby', 'noisy kids']),
  ((SELECT id FROM q), 4, 'Security', 12, ARRAY['tsa', 'security lines', 'security check', 'going through security']),
  ((SELECT id FROM q), 5, 'Turbulence', 10, ARRAY['bumpy ride', 'rough air']),
  ((SELECT id FROM q), 6, 'Lost Luggage', 8, ARRAY['luggage', 'lost bags', 'baggage', 'missing luggage']),
  ((SELECT id FROM q), 7, 'Middle Seat', 7, ARRAY['bad seat', 'seat assignment', 'no window']);

-- Question 47: Clothing
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something people wear to the gym', 6, 'clothing', 'easy', 'archive', true, ARRAY['clothing', 'fitness', 'gym']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something people wear to the gym')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Sneakers', 30, ARRAY['tennis shoes', 'running shoes', 'athletic shoes', 'trainers', 'gym shoes']),
  ((SELECT id FROM q), 2, 'Shorts', 22, ARRAY['gym shorts', 'athletic shorts', 'short']),
  ((SELECT id FROM q), 3, 'T-Shirt', 18, ARRAY['tshirt', 't shirt', 'tank top', 'tanktop', 'shirt']),
  ((SELECT id FROM q), 4, 'Leggings', 12, ARRAY['yoga pants', 'tights', 'legging', 'spandex']),
  ((SELECT id FROM q), 5, 'Sweatband', 10, ARRAY['headband', 'wristband', 'sweat band', 'head band']),
  ((SELECT id FROM q), 6, 'Sports Bra', 8, ARRAY['sportsbra', 'athletic bra']);

-- Question 48: Family
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something grandma always has in her house', 7, 'family', 'easy', 'archive', true, ARRAY['family', 'grandparents', 'nostalgia']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something grandma always has in her house')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Candy', 28, ARRAY['candies', 'sweets', 'hard candy', 'candy dish', 'chocolate']),
  ((SELECT id FROM q), 2, 'Cookies', 20, ARRAY['cookie', 'baked goods', 'homemade cookies']),
  ((SELECT id FROM q), 3, 'Pictures', 15, ARRAY['photos', 'photo albums', 'family photos', 'photographs', 'picture frames']),
  ((SELECT id FROM q), 4, 'Tissues', 10, ARRAY['tissue', 'kleenex', 'napkins']),
  ((SELECT id FROM q), 5, 'Knick-Knacks', 10, ARRAY['knickknacks', 'figurines', 'collectibles', 'decorations']),
  ((SELECT id FROM q), 6, 'Doilies', 8, ARRAY['doily', 'lace', 'tablecloth', 'plastic on furniture']),
  ((SELECT id FROM q), 7, 'Medicine', 9, ARRAY['pills', 'medications', 'prescription', 'pill box']);

-- Question 49: Food
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name a food that comes in a can', 7, 'food', 'easy', 'archive', true, ARRAY['food', 'canned', 'pantry']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name a food that comes in a can')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Soup', 28, ARRAY['soups', 'chicken soup', 'tomato soup', 'chicken noodle soup']),
  ((SELECT id FROM q), 2, 'Beans', 22, ARRAY['bean', 'baked beans', 'green beans', 'kidney beans', 'black beans']),
  ((SELECT id FROM q), 3, 'Tuna', 15, ARRAY['tuna fish', 'canned tuna', 'chicken of the sea']),
  ((SELECT id FROM q), 4, 'Corn', 12, ARRAY['canned corn', 'creamed corn']),
  ((SELECT id FROM q), 5, 'Soda', 10, ARRAY['pop', 'coke', 'pepsi', 'soft drink', 'soft drinks']),
  ((SELECT id FROM q), 6, 'Vegetables', 7, ARRAY['veggies', 'mixed vegetables', 'peas', 'carrots']),
  ((SELECT id FROM q), 7, 'Spam', 6, ARRAY['canned meat', 'potted meat', 'vienna sausages']);

-- Question 50: Holidays
INSERT INTO questions (id, text, answer_count, category, difficulty, source, fast_money_ok, tags)
VALUES (gen_random_uuid(), 'Name something people do on New Years Eve', 7, 'holidays', 'easy', 'archive', true, ARRAY['holidays', 'new years', 'celebration']);

WITH q AS (SELECT id FROM questions WHERE text = 'Name something people do on New Years Eve')
INSERT INTO answers (question_id, rank, text, points, aliases)
VALUES
  ((SELECT id FROM q), 1, 'Countdown', 25, ARRAY['count down', 'the countdown', 'count down to midnight']),
  ((SELECT id FROM q), 2, 'Drink Champagne', 22, ARRAY['champagne', 'drink', 'toast', 'drinking']),
  ((SELECT id FROM q), 3, 'Kiss at Midnight', 18, ARRAY['kiss', 'midnight kiss', 'kiss someone']),
  ((SELECT id FROM q), 4, 'Party', 12, ARRAY['go to a party', 'throw a party', 'celebrate', 'partying']),
  ((SELECT id FROM q), 5, 'Watch the Ball Drop', 10, ARRAY['ball drop', 'times square', 'watch ball drop', 'watch tv']),
  ((SELECT id FROM q), 6, 'Make Resolutions', 7, ARRAY['resolutions', 'new years resolution', 'new years resolutions', 'resolution']),
  ((SELECT id FROM q), 7, 'Fireworks', 6, ARRAY['firework', 'watch fireworks', 'fire works']);
