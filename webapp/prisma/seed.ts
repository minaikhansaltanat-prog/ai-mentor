import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding subjects, topics, lessons, achievements...");

  const subjects = [
    {
      code: "math",
      nameKk: "Математика",
      nameRu: "Математика",
      icon: "trend",
      topics: [
        {
          titleKk: "Бөлшектер",
          titleRu: "Дроби",
          gradeMin: 5,
          gradeMax: 7,
          lessons: [
            {
              theoryKk: "Бөлшек — бүтіннің бөлігі. Бөлшек a/b түрінде жазылады, мұндағы a — алымы, b — бөлімі.",
              theoryRu: "Дробь — это часть целого. Дробь записывается как a/b, где a — числитель, b — знаменатель.",
              exampleKk: "Мысалы: 1/2 + 1/4 = 2/4 + 1/4 = 3/4.",
              exampleRu: "Например: 1/2 + 1/4 = 2/4 + 1/4 = 3/4.",
              practiceQuestionKk: "2/3 + 1/6 неге тең?",
              practiceQuestionRu: "Чему равно 2/3 + 1/6?",
              practiceAnswer: "5/6",
              hintKk: "Ортақ бөлімге келтір — 6.",
              hintRu: "Приведи к общему знаменателю — 6.",
            },
          ],
        },
        {
          titleKk: "Квадрат теңдеулер",
          titleRu: "Квадратные уравнения",
          gradeMin: 8,
          gradeMax: 9,
          lessons: [
            {
              theoryKk: "Квадрат теңдеулер ax² + bx + c = 0 түрінде жазылады, мұндағы a ≠ 0. Дискриминант D = b² − 4ac.",
              theoryRu: "Квадратное уравнение имеет вид ax² + bx + c = 0, где a ≠ 0. Дискриминант D = b² − 4ac.",
              exampleKk: "x² + 5x + 6 = 0: D = 25 − 24 = 1. x₁ = −2, x₂ = −3.",
              exampleRu: "x² + 5x + 6 = 0: D = 25 − 24 = 1. x₁ = −2, x₂ = −3.",
              practiceQuestionKk: "x² − 3x − 4 = 0 теңдеуінің түбірлерін тап.",
              practiceQuestionRu: "Найди корни уравнения x² − 3x − 4 = 0.",
              practiceAnswer: "4;-1",
              hintKk: "Дискриминантты есепте: D = 9 + 16 = 25.",
              hintRu: "Вычисли дискриминант: D = 9 + 16 = 25.",
            },
          ],
        },
        {
          titleKk: "Тригонометрия негіздері",
          titleRu: "Основы тригонометрии",
          gradeMin: 10,
          gradeMax: 11,
          lessons: [
            {
              theoryKk: "sin, cos, tan — тік бұрышты үшбұрыштың қабырғалары арасындағы қатынас.",
              theoryRu: "sin, cos, tan — отношения между сторонами прямоугольного треугольника.",
              exampleKk: "sin(30°) = 0.5, cos(60°) = 0.5.",
              exampleRu: "sin(30°) = 0.5, cos(60°) = 0.5.",
              practiceQuestionKk: "sin²(x) + cos²(x) неге тең?",
              practiceQuestionRu: "Чему равно sin²(x) + cos²(x)?",
              practiceAnswer: "1",
              hintKk: "Бұл негізгі тригонометриялық сәйкестік.",
              hintRu: "Это основное тригонометрическое тождество.",
            },
          ],
        },
      ],
    },
    {
      code: "english",
      nameKk: "Ағылшын тілі",
      nameRu: "Английский язык",
      icon: "chat",
      topics: [
        {
          titleKk: "Present Simple",
          titleRu: "Present Simple",
          gradeMin: 5,
          gradeMax: 7,
          lessons: [
            {
              theoryKk: "Present Simple — үнемі қайталанатын әрекеттерді білдіреді. Мысалы: I go to school every day.",
              theoryRu: "Present Simple используется для регулярных действий. Например: I go to school every day.",
              exampleKk: "She plays tennis on Sundays.",
              exampleRu: "She plays tennis on Sundays.",
              practiceQuestionKk: "Дұрыс форманы жаз: He ___ (go) to school every day.",
              practiceQuestionRu: "Напиши правильную форму: He ___ (go) to school every day.",
              practiceAnswer: "goes",
              hintKk: "He/She/It үшін етістікке -s/-es жалғауы жалғанады.",
              hintRu: "Для He/She/It к глаголу добавляется -s/-es.",
            },
          ],
        },
      ],
    },
    {
      code: "physics",
      nameKk: "Физика",
      nameRu: "Физика",
      icon: "brain",
      topics: [
        {
          titleKk: "Механика негіздері",
          titleRu: "Основы механики",
          gradeMin: 8,
          gradeMax: 9,
          lessons: [
            {
              theoryKk: "Ньютонның екінші заңы: F = ma, мұндағы F — күш, m — масса, a — үдеу.",
              theoryRu: "Второй закон Ньютона: F = ma, где F — сила, m — масса, a — ускорение.",
              exampleKk: "Егер m = 2 кг, a = 3 м/с², онда F = 6 Н.",
              exampleRu: "Если m = 2 кг, a = 3 м/с², то F = 6 Н.",
              practiceQuestionKk: "m = 5 кг, a = 2 м/с² болса, F неге тең?",
              practiceQuestionRu: "Если m = 5 кг, a = 2 м/с², чему равно F?",
              practiceAnswer: "10",
              hintKk: "F = m × a формуласын қолдан.",
              hintRu: "Используй формулу F = m × a.",
            },
          ],
        },
      ],
    },
    {
      code: "cs",
      nameKk: "Информатика",
      nameRu: "Информатика",
      icon: "book",
      topics: [
        {
          titleKk: "Алгоритм негіздері",
          titleRu: "Основы алгоритмов",
          gradeMin: 5,
          gradeMax: 7,
          lessons: [
            {
              theoryKk: "Алгоритм — есепті шешудің нақты қадамдар тізбегі.",
              theoryRu: "Алгоритм — это чёткая последовательность шагов для решения задачи.",
              exampleKk: "Санды екіге көбейту алгоритмі: санды оқы → 2-ге көбейт → нәтижені шығар.",
              exampleRu: "Алгоритм умножения числа на два: считать число → умножить на 2 → вывести результат.",
              practiceQuestionKk: "Егер санды енгізу, оны квадраттау, нәтижені шығару қадамдары болса — бұл нені сипаттайды?",
              practiceQuestionRu: "Если шаги: ввод числа, возведение в квадрат, вывод результата — что это описывает?",
              practiceAnswer: "алгоритм",
              hintKk: "Бұл — қадамдар тізбегінің атауы.",
              hintRu: "Это название последовательности шагов.",
            },
          ],
        },
      ],
    },
  ];

  for (const s of subjects) {
    const subject = await db.subject.upsert({
      where: { code: s.code },
      update: { nameKk: s.nameKk, nameRu: s.nameRu, icon: s.icon },
      create: { code: s.code, nameKk: s.nameKk, nameRu: s.nameRu, icon: s.icon },
    });

    let order = 0;
    for (const topic of s.topics) {
      const existing = await db.topic.findFirst({ where: { subjectId: subject.id, titleKk: topic.titleKk } });
      const topicRow = existing
        ? await db.topic.update({
            where: { id: existing.id },
            data: { titleRu: topic.titleRu, gradeMin: topic.gradeMin, gradeMax: topic.gradeMax, order },
          })
        : await db.topic.create({
            data: {
              subjectId: subject.id,
              titleKk: topic.titleKk,
              titleRu: topic.titleRu,
              gradeMin: topic.gradeMin,
              gradeMax: topic.gradeMax,
              order,
            },
          });
      order++;

      let lOrder = 0;
      for (const lesson of topic.lessons) {
        const existingLesson = await db.lesson.findFirst({ where: { topicId: topicRow.id, order: lOrder } });
        if (existingLesson) {
          await db.lesson.update({ where: { id: existingLesson.id }, data: lesson });
        } else {
          await db.lesson.create({ data: { ...lesson, topicId: topicRow.id, order: lOrder } });
        }
        lOrder++;
      }
    }
  }

  const achievements = [
    { code: "first_100", titleKk: "100 есеп", titleRu: "100 задач", descKk: "100 есеп шығарылды", descRu: "Решено 100 задач", xpReward: 200, icon: "trophy" },
    { code: "streak_30", titleKk: "30 күн серия", titleRu: "Серия 30 дней", descKk: "30 күн үздіксіз оқу", descRu: "30 дней занятий подряд", xpReward: 300, icon: "star" },
    { code: "math_master", titleKk: "Math Master", titleRu: "Math Master", descKk: "50 математика есебін шешу", descRu: "Решено 50 задач по математике", xpReward: 250, icon: "trend" },
    { code: "english_starter", titleKk: "English Starter", titleRu: "English Starter", descKk: "200 жаңа сөз үйрену", descRu: "Выучено 200 новых слов", xpReward: 150, icon: "chat" },
    { code: "first_lesson", titleKk: "Алғашқы қадам", titleRu: "Первый шаг", descKk: "Алғашқы сабақты аяқтады", descRu: "Завершён первый урок", xpReward: 50, icon: "check" },
  ];

  for (const a of achievements) {
    await db.achievement.upsert({ where: { code: a.code }, update: a, create: a });
  }

  const demoSchool = await db.school.upsert({
    where: { joinCode: "DEMO01" },
    update: {},
    create: { name: "№1 үлгілі мектеп", joinCode: "DEMO01" },
  });

  await db.classRoom.upsert({
    where: { joinCode: "CLASS7A" },
    update: {},
    create: { name: "7А", grade: 7, joinCode: "CLASS7A", schoolId: demoSchool.id },
  });

  console.log("Demo school join code: DEMO01");
  console.log("Demo class join code: CLASS7A");
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
