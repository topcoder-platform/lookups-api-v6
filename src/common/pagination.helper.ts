import { Response, Request } from 'express';
import { URL } from 'url';

export function setPaginationHeaders(
  res: Response,
  req: Request,
  total: number,
  page: number,
  perPage: number,
) {
  const totalPages = Math.ceil(total / perPage);
  // Create a URL object to safely manipulate the request URL
  const url = new URL(req.originalUrl, `${req.protocol}://${req.get('host')}`);

  const getPageLink = (p: number) => {
    const params = new URLSearchParams(url.search);
    params.set('page', p.toString());
    return `${url.pathname}?${params.toString()}`;
  };

  // Explicitly type the array as string[] to fix the error
  const links: string[] = [];
  if (page < totalPages) {
    links.push(`<${getPageLink(page + 1)}>; rel="next"`);
  }
  if (page > 1) {
    links.push(`<${getPageLink(page - 1)}>; rel="prev"`);
  }
  links.push(`<${getPageLink(totalPages)}>; rel="last"`);
  links.push(`<${getPageLink(1)}>; rel="first"`);

  res.set('X-Page', page.toString());
  res.set('X-Per-Page', perPage.toString());
  res.set('X-Total', total.toString());
  res.set('X-Total-Pages', totalPages.toString());
  res.set('Link', links.join(', '));
  // Expose headers for browser access (CORS)
  res.set(
    'Access-Control-Expose-Headers',
    'X-Page, X-Per-Page, X-Total, X-Total-Pages, Link',
  );
}
