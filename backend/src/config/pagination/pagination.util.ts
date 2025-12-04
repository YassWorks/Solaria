import { PaginationQuery } from './pagination.interface';

export async function paginate(
  model: any,
  query: any,
  options: PaginationQuery,
  projection?: string,
  sort: any = { createdAt: -1 },
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.max(1, Math.min(options.limit || 10, 100));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model
      .find(query)
      .select(projection || '')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    model.countDocuments(query),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
