import type { Scene, VoiceOption, VoiceType } from "./types";

export const SCENES: Scene[] = [
  {
    id: "anniversary",
    title: "忘记纪念日",
    shortDesc: "三周年纪念日，你完全忘了",
    emoji: "📅",
    description:
      "今天是你们在一起三周年纪念日。对方从早上就开始期待，特意打扮好等你约ta。结果一整天过去了，你半句没提纪念日的事，晚上对方忍不住旁敲侧击问了一句，你还一脸茫然地说'啊？今天什么日子？'。对方非常失望和委屈。",
  },
  {
    id: "ignored_messages",
    title: "深夜不回消息",
    shortDesc: "打游戏到凌晨，十几条消息都没回",
    emoji: "📱",
    description:
      "你昨晚打游戏打到凌晨三点，对方从晚上十点开始给你发了十几条消息，你一条都没回。对方从一开始的担心，到后来的生气，再到最后的失望，一晚上都没睡好。第二天早上你醒来才看到消息，对方已经非常生气了。",
  },
  {
    id: "flirty_chat",
    title: "和异性聊天被发现",
    shortDesc: "对方看到了你和异性的暧昧聊天",
    emoji: "💬",
    description:
      "对方无意中看到了你手机里和一位异性朋友的聊天记录，虽然你觉得只是普通朋友，但聊天内容确实有些暧昧和越界，比如互相说'想你了'、聊到深夜、分享日常琐事等。对方感到非常受伤和不信任。",
  },
  {
    id: "lost_cat",
    title: "把对方的猫弄丢了",
    shortDesc: "帮对方照顾猫，结果猫跑丢了",
    emoji: "🐱",
    description:
      "对方出差，把心爱的猫咪托付给你照顾。结果你出门扔垃圾的时候没关好门，猫咪跑出去了。你找了一下午都没找到，不知道该怎么跟对方交代。对方刚下飞机就收到你的消息，说猫丢了。对方又急又气，快哭了。",
  },
  {
    id: "public_embarrassment",
    title: "当众让对方面子",
    shortDesc: "朋友聚会上开了过分的玩笑",
    emoji: "🎭",
    description:
      "在朋友聚会上，你为了活跃气氛，开了一个关于对方的过分玩笑，引得大家哄堂大笑，但对方明显感到尴尬和不舒服。聚会结束后，对方一直憋着没说话，回家的路上终于爆发了，觉得你根本不尊重ta。",
  },
];

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "gentle_female",
    label: "温柔女声",
    speakerId: "zh_female_xiaohe_uranus_bigtts",
    gender: "girlfriend",
    personality: "温柔细腻，有点敏感，生气时更多是委屈和难过，说话软但带着哭腔",
  },
  {
    id: "dominant_female",
    label: "霸道御姐",
    speakerId: "zh_female_vv_uranus_bigtts",
    gender: "girlfriend",
    personality: "强势直接，说话带刺，生气时会冷嘲热讽、毒舌，但内心其实很在意",
  },
  {
    id: "cute_female",
    label: "可爱软妹",
    speakerId: "saturn_zh_female_keainvsheng_tob",
    gender: "girlfriend",
    personality: "娇滴滴的，爱撒娇，生气时会嘟嘟嘴闹小脾气，很好哄，一哄就软",
  },
  {
    id: "deep_male",
    label: "低沉男声",
    speakerId: "zh_male_m191_uranus_bigtts",
    gender: "boyfriend",
    personality: "沉稳少言，生气时更多是沉默和冷淡，话变少，气场压抑",
  },
  {
    id: "gentle_male",
    label: "温柔男声",
    speakerId: "zh_male_taocheng_uranus_bigtts",
    gender: "boyfriend",
    personality: "温柔体贴，生气时是失望大于愤怒，会讲道理，会沟通，但也会难过",
  },
];

export function getVoiceById(id: VoiceType): VoiceOption {
  return VOICE_OPTIONS.find((v) => v.id === id) || VOICE_OPTIONS[0];
}

export function getSceneById(id: string): Scene | undefined {
  return SCENES.find((s) => s.id === id);
}

export const INITIAL_SCORE = 20;
export const WIN_SCORE = 80;
export const LOSE_SCORE = -50;
export const TOTAL_ROUNDS = 10;
export const MAX_RETRIES = 2;
