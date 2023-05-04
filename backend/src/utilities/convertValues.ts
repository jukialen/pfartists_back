export const stringToJsonForGet = async (orderBy?: string, where?: string) => {
  let orderE: unknown;

  if (typeof orderBy === 'string') {
    const order = orderBy.split(', ');

    for (const or of order) {
      const data = or.replace(/(\w+:)|(\w+ :)/g, function (s) {
        return '"' + s.substring(0, s.length - 1) + '":';
      });

      orderE = await JSON.parse(data);
    }
  }

  let whereObj: unknown;
  if (typeof where === 'string') {
    const whereData = where.replace(/(\w+:)|(\w+ :)/g, function (s) {
      return '"' + s.substring(0, s.length - 1) + '":';
    });

    whereObj = await JSON.parse(whereData);
  }

  return {
    orderE,
    whereObj,
  };
};
