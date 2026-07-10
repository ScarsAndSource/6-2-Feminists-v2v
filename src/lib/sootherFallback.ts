interface FallbackReply {
  keywords: string[];
  reply: string;
}

const FALLBACK_REPLIES: FallbackReply[] = [
  { keywords: ['cramp', 'cramps', 'period pain', 'pelvic pain', 'aching', 'sore'],
    reply: "Cramps like this are exhausting, and it's completely fair to be over it right now. A heating pad or warm bath can genuinely help take the edge off. Try curling up somewhere warm for a bit if you can - you don't have to push through this." },
  { keywords: ['bloated', 'bloating', 'stomach', 'belly'],
    reply: "That bloated, tight feeling is so uncomfortable, and it makes sense you'd want relief. Some warm ginger or peppermint tea and a bit of gentle movement can help. Loose, comfortable clothing helps more than people admit too." },
  { keywords: ['headache', 'migraine', 'head hurts'],
    reply: "A headache on top of everything else is rough. Try some water and a few minutes somewhere dim and quiet if you can find them. Be gentle with yourself about anything that can wait." },
  { keywords: ['nausea', 'nauseous', 'want to throw up', 'queasy'],
    reply: "Feeling nauseous is such an unsettling kind of discomfort. Ginger tea and small sips of water can help, and there's no shame in lying still for a bit. This will pass." },
  { keywords: ['dizzy', 'dizziness', 'lightheaded', 'room spinning'],
    reply: "Dizziness is scary in the moment. If you can, sit or lie down right now until it settles, and have some water nearby. Go slow when you do get up." },
  { keywords: ['back pain', 'my back hurts'],
    reply: "Back pain has a way of making everything else harder too. A warm compress and some gentle stretching, if it feels okay, can help. Try not to push through it today." },
  { keywords: ['tired', 'exhausted', 'fatigue', 'no energy', 'drained'],
    reply: "It's okay to be tired right now, your body is doing a lot. You don't need to push through today at full speed. If you can, let yourself rest without guilt - this kind of tired isn't laziness, it's real." },
  { keywords: ["can't sleep", 'insomnia', 'awake all night', 'restless'],
    reply: "Not being able to sleep on top of everything else is genuinely rough. Try putting the phone down for a few minutes and just letting your breathing slow, in for 4, out for 6. Rest counts even if real sleep doesn't come right away." },
  { keywords: ['breast', 'chest tender', 'sore chest'],
    reply: "Tenderness like that can make even a hug feel like too much. A soft, supportive bra and maybe cutting back on caffeine today can help a little. It's a normal, if annoying, part of this." },
  { keywords: ['acne', 'breakout', 'skin', 'pimple'],
    reply: "Breakouts showing up on top of everything else can feel unfair, but this is hormonal, not something you caused. Be gentle with your skin and with yourself today. It'll settle." },
  { keywords: ['craving', 'cravings', 'want to eat everything', 'hungry all the time'],
    reply: "Cravings like this are so normal right now, your body isn't being dramatic. It's okay to have what sounds good in a portion that feels right. Try not to fight it too hard." },
  { keywords: ['constipated', "can't poop", 'digestion'],
    reply: "That kind of discomfort is genuinely unpleasant to sit with. Water, a short walk, and a little patience with your body can help. It'll pass." },
  { keywords: ['diarrhea', 'upset stomach', 'stomach issues'],
    reply: "That's uncomfortable and honestly a little draining too. Small sips of water and bland, easy food for now. Rest if you can - there's no need to push through errands today." },
  { keywords: ['swollen', 'swelling', 'water retention', 'puffy'],
    reply: "That puffy, swollen feeling is annoying and very common around this time. Elevating your feet for a bit and staying hydrated can genuinely help. It's not permanent." },
  { keywords: ['brain fog', "can't focus", "can't think straight", 'foggy'],
    reply: "Brain fog like this is real, even though it's hard to explain to anyone who hasn't felt it. Try breaking whatever you're doing into smaller pieces today. Be a little extra patient with yourself." },
  { keywords: ['hot flash', 'overheating', 'too hot'],
    reply: "That sudden heat is uncomfortable and can feel like it comes out of nowhere. Layers you can shed and some water nearby can help. It'll pass in a few minutes." },
  { keywords: ['anxious', 'anxiety', 'worried', 'nervous', 'panicking', 'panic'],
    reply: "It sounds like your mind is racing a bit right now, and that's a really uncomfortable place to be. Let's slow down together for a second - try breathing in for 4 counts, holding for 4, and out for 6. I'm right here with you." },
  { keywords: ['sad', 'crying', 'want to cry', 'down', 'low', 'upset'],
    reply: "It's okay to feel this low, you don't need a reason that makes sense to anyone else. Whatever's coming up for you right now is valid. If crying is what your body wants to do, that's alright too - it can be its own kind of release." },
  { keywords: ['angry', 'irritable', 'frustrated', 'snapping', 'annoyed', 'mood swing'],
    reply: "Feeling irritable like this is genuinely one of the hardest parts of days like today, and it's not a character flaw, it's chemistry. It's alright to have a short fuse right now. Try to be as gentle with yourself as you'd want others to be with you." },
  { keywords: ['numb', 'feel nothing', 'empty', 'flat'],
    reply: "Feeling numb or flat like this is its own kind of hard, even without a sharp emotion attached to it. You don't have to force yourself to feel a certain way right now. Just being here, noticing it, is enough for this moment." },
  { keywords: ['guilty', 'guilt', 'feel bad about'],
    reply: "That guilt is a heavy thing to carry, especially on a day when your body's already asking a lot of you. You're allowed to prioritize how you feel right now without it meaning you've failed anyone. Be as kind to yourself as you would to a friend saying this to you." },
  { keywords: ['comparing myself', 'everyone else seems fine', 'why is it worse for me'],
    reply: "It's easy to feel like you're the only one struggling with this, but bodies and cycles vary a lot more than people let on. Whatever you're feeling is real regardless of how it looks for anyone else. This isn't a competition you're losing." },
  { keywords: ['not believed', 'doctor dismissed', 'ignored', 'nobody listens', "no one believes"],
    reply: "I'm sorry you've felt dismissed like that, it's a genuinely painful thing to carry. What you're feeling is real, whether or not it's been taken seriously yet. Your Case File exists exactly so your numbers can speak for you next time - you deserve to be heard." },
  { keywords: ['lonely', 'alone', 'no one understands', 'isolated'],
    reply: "Feeling alone with this is hard, especially on days when your body doesn't feel like your own. I'm glad you said something instead of sitting with it in silence. You're not overreacting, and you're not alone in this moment." },
  { keywords: ['overwhelmed', "can't cope", 'too much', 'breaking down'],
    reply: "It sounds like a lot is piling up right now. You don't have to handle all of it at once - just this next minute is enough for now. Let's breathe slowly together for a moment before anything else." },
  { keywords: ['embarrassed', 'ashamed', 'gross', 'disgusting'],
    reply: "Please don't be hard on yourself about this, there's nothing shameful about how your body works. This is just biology, not something to feel embarrassed about. You're allowed to take up space exactly as you are today." },
  { keywords: ['partner doesn\'t understand', 'boyfriend doesn\'t get it', 'family doesn\'t understand', 'nobody gets it'],
    reply: "It's genuinely hard when the people around you haven't felt this and can't quite picture it. That gap doesn't make what you're going through any less real. You're allowed to ask for what you need even if they don't fully understand why." },
  { keywords: ['missed my period', 'period is late', 'why is my period late'],
    reply: "A late period can bring up a lot of worry, and that's completely understandable. I can't tell you what's going on medically, but the Doctor Flags stage looks at your actual cycle data and can tell you if this is worth a visit. You're not overreacting by being concerned." },
  { keywords: ['heavy flow', 'bleeding a lot', 'heavier than usual'],
    reply: "That sounds uncomfortable and probably a little alarming too. I can't say what's causing it, but it's worth checking the Doctor Flags stage or a professional if it feels like more than usual for you. Trust that instinct." },
  { keywords: ['painful sex', 'hurts during', 'pain during intimacy'],
    reply: "That's a genuinely difficult thing to deal with, and it's completely valid to want answers. This isn't something I can help explain, but it's absolutely worth bringing up with a doctor - they'll have heard it before and won't be fazed by it. You deserve comfort, not just endurance." },
  { keywords: ['work is hard today', "can't focus at work", 'school is hard', 'missed class', 'missed work'],
    reply: "Trying to function normally on a day like this is genuinely hard, and it's okay if today looks a little different. Be as understanding with yourself as you'd want your body to be with you. Whatever gets done today is enough." },
  { keywords: ['distract me', 'need a distraction', 'take my mind off'],
    reply: "That makes sense - sometimes the kindest thing is just a little space from how you're feeling. Maybe a favorite show, a playlist, or even just watching something silly for a while. I'm still here whenever you want to come back to this." },
  { keywords: ['don\'t want advice', 'just listen', 'just sit with me'],
    reply: "Of course - I'm right here, no advice needed unless you want it. Take whatever time you need. I'm not going anywhere." },
  { keywords: ['scared', 'worried this is serious', 'is this normal', 'what is wrong with me'],
    reply: "It's understandable to feel worried when something feels off in your body. I can't tell you what's medically going on, but I can say your concern is valid, and your Case File and the Doctor Flags stage are there to help you take this to someone who can actually answer that." },
  { keywords: ['good day', 'feeling okay today', 'better today', 'feeling good'],
    reply: "I'm really glad to hear that. Days like this are worth noticing too, not just the hard ones. Enjoy it." },
  { keywords: ['thank you', 'thanks', 'that helped', 'feel better'],
    reply: "I'm really glad that helped, even a little. You're doing better than you're giving yourself credit for right now." },
  { keywords: ['bye', 'goodbye', 'talk later', 'gotta go'],
    reply: "Take care of yourself. I'll be right here whenever you need me again." },
  { keywords: ['hi', 'hello', 'hey', 'just checking in'],
    reply: "Hi, I'm glad you're here. How's your body feeling right now, and how's the rest of you doing today?" }
];

const DEFAULT_REPLY =
  "I hear you. Whatever you're feeling right now is valid, even if it's hard to put into words. " +
  "Want to tell me a bit more about what's going on, or would a moment of quiet together help more right now?";

export function matchFallbackReply(message: string): string {
  const lower = message.toLowerCase();
  const match = FALLBACK_REPLIES.find(f => f.keywords.some(k => lower.includes(k)));
  return match ? match.reply : DEFAULT_REPLY;
}
