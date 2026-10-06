import type { Guide, Line, NestLineId } from '../engine/types';

/**
 * The NestJS division: the backend half of the job, drilled as questions.
 * Checked against the NestJS docs (request lifecycle, validation, scopes).
 */
export const NEST_LINES: Line[] = [
  {
    id: 'life',
    division: 'nest',
    kind: 'flow',
    bullet: '1',
    color: '--red',
    short: 'Lifecycle',
    name: 'Main Line',
    topic: 'Request lifecycle',
    pitch: 'Every NestJS interview asks some version of "what happens when a request comes in?" This is that question, as a train ride.',
    rules: [
      'Click the stages in the exact order they run.',
      'Some requests never reach the handler. Follow where the request actually goes.',
      'On the way out, the order reverses.',
    ],
    hook: 'Middleware → Guards → Interceptors (before) → Pipes → Handler → Service → Interceptors (after) → Filters → Response.',
    par: 95,
    flows: [
      {
        t: 1,
        title: 'POST /users with a valid body, nothing blocks it',
        steps: [
          'Middleware',
          'Guard',
          'Interceptor (before)',
          'Pipe / ValidationPipe',
          'Route handler',
          'Service',
          'Interceptor (after)',
          'Response sent',
        ],
        note: 'The full happy path. Notice the interceptor appears twice: once on the way in, once on the way out.',
      },
      {
        t: 1,
        title: 'GET /admin, and the auth guard returns false',
        steps: ['Middleware', 'Guard', 'Exception filter', 'Response sent'],
        note: 'A guard rejection short-circuits everything. Pipes never run, the handler never runs, and the 403 comes from a filter.',
      },
      {
        t: 1,
        title: 'POST /users where the body fails validation',
        steps: [
          'Middleware',
          'Guard',
          'Interceptor (before)',
          'Pipe / ValidationPipe',
          'Exception filter',
          'Response sent',
        ],
        note: 'Guards already passed and the interceptor already started, so the pipe throwing lands in the filter on the way out.',
      },
      {
        t: 2,
        title: 'GET /users/7, the service throws NotFoundException',
        steps: [
          'Middleware',
          'Guard',
          'Interceptor (before)',
          'Pipe / ValidationPipe',
          'Route handler',
          'Service',
          'Exception filter',
          'Response sent',
        ],
        note: 'The handler ran. The error still ends up in a filter, which is why you never touch res.status in a service.',
      },
      {
        t: 2,
        title: 'Three guards on one route: one global, one on the controller, one on the route',
        steps: ['Global guard', 'Controller guard', 'Route guard'],
        note: 'On the way in, it is always global, then controller, then route. Same for interceptors and pipes.',
      },
      {
        t: 2,
        title: 'The handler returned. Three interceptors are waiting on the way out',
        steps: [
          'Route interceptor',
          'Controller interceptor',
          'Global interceptor',
          'Response sent',
        ],
        note: 'Coming back out the order reverses, so the most specific one finishes first and the global one wraps everything.',
      },
      {
        t: 3,
        title: 'Full run: global and module middleware, a global and a route guard, global and route interceptors, a global pipe and a param pipe',
        steps: [
          'Global middleware',
          'Module middleware',
          'Global guard',
          'Route guard',
          'Global interceptor (before)',
          'Route interceptor (before)',
          'Global pipe',
          'Route param pipe',
          'Route handler',
          'Service',
          'Route interceptor (after)',
          'Global interceptor (after)',
          'Response sent',
        ],
        note: 'This is the whole thing. In: global to specific. Out: specific to global.',
      },
    ],
  },
  {
    id: 'di',
    division: 'nest',
    kind: 'quiz',
    bullet: '2',
    color: '--blue',
    short: 'DI & modules',
    name: 'Wiring Yard',
    topic: 'Dependency injection and modules',
    pitch: "\"Nest can't resolve dependencies of the OrdersService (?)\" is the error you will hit most, and the one they love to ask about. It is almost always one of four mistakes.",
    rules: [
      'Read the modules, then answer the question about them.',
      'Think: is it provided, is it exported, is the module imported?',
      'Wrong answers still show you why.',
    ],
    hook: 'providers is private. exports makes it public. imports is how another module asks for it. All three have to line up.',
    par: 110,
    questions: [
      {
        t: 1,
        q: 'OrdersService injects UsersService. What happens when the app starts?',
        code: `@Module({ providers: [UsersService] })        // no exports
export class UsersModule {}

@Module({ imports: [UsersModule], providers: [OrdersService] })
export class OrdersModule {}`,
        opts: [
          "Nest can't resolve dependencies of OrdersService",
          'It works, because OrdersModule imports UsersModule',
          'It works, but Orders quietly gets a second copy',
        ],
        a: "Nest can't resolve dependencies of OrdersService",
        why: 'Importing a module only gives you what that module exports. providers stays private. Add UsersService to UsersModule exports.',
      },
      {
        t: 1,
        q: 'Same two services, but now UsersModule exports UsersService and OrdersModule has no imports. What happens?',
        code: `@Module({ providers: [UsersService], exports: [UsersService] })
export class UsersModule {}

@Module({ providers: [OrdersService] })   // imports: ???
export class OrdersModule {}`,
        opts: [
          'It fails. OrdersModule still has to import UsersModule',
          'It works, because exporting publishes it app-wide',
          'It works, since both modules live in the same app',
        ],
        a: 'It fails. OrdersModule still has to import UsersModule',
        why: 'Both halves are required: the owner exports, the consumer imports. Exporting alone just makes it available to whoever asks.',
      },
      {
        t: 1,
        q: 'What makes a class injectable in NestJS?',
        opts: [
          "@Injectable() on it, and listed in a module's providers",
          '@Injectable() on it, and exported from its own file',
          'A public constructor and no circular imports',
        ],
        a: "@Injectable() on it, and listed in a module's providers",
        why: '@Injectable() marks it for Nest, providers tells a module to build it. Miss either one and injection fails.',
      },
      {
        t: 2,
        q: 'UsersService keeps an in-memory cache. Two modules both list it in providers. What is true?',
        code: `@Module({ providers: [UsersService] }) export class AModule {}
@Module({ providers: [UsersService] }) export class BModule {}`,
        opts: [
          'Each module gets its own instance, so the caches drift',
          'They share one instance, so the cache stays in sync',
          'Nest throws a duplicate provider error at startup',
        ],
        a: 'Each module gets its own instance, so the caches drift',
        why: 'A provider is a singleton per module that provides it, not per app. Provide it once, export it, and import that module everywhere else.',
      },
      {
        t: 2,
        q: 'You want ConfigService available in every module without importing ConfigModule 20 times. What do you do?',
        opts: [
          'Mark ConfigModule @Global() and export ConfigService',
          "Add ConfigService to every module's providers list",
          'Export ConfigService from AppModule to the whole app',
        ],
        a: 'Mark ConfigModule @Global() and export ConfigService',
        why: "@Global() registers the module's exports app-wide. Use it sparingly, since it hides the dependency graph.",
      },
      {
        t: 2,
        q: 'AuthService injects UsersService, and UsersService injects AuthService. How do you make that work?',
        opts: [
          'Wrap both references in forwardRef(() => Other)',
          'Mark both services @Global() so Nest can find them',
          'Register both in one module and drop the imports',
        ],
        a: 'Wrap both references in forwardRef(() => Other)',
        why: 'forwardRef defers the reference so Nest can finish building the circle. It is also a smell worth mentioning in an interview: the circle often means the responsibilities are wrong.',
      },
      {
        t: 2,
        q: 'UsersService is declared @Injectable({ scope: Scope.REQUEST }). UsersController injects it. What happens to the controller?',
        opts: [
          'The controller becomes request-scoped as well',
          'Only the service is rebuilt on each request',
          'Nest rejects it, because controllers are singletons',
        ],
        a: 'The controller becomes request-scoped as well',
        why: 'Scope bubbles up the injection chain. That is the performance warning in the docs: a new instance per request for everything above it.',
      },
      {
        t: 2,
        q: 'In a unit test, how do you swap the real UsersService for a fake?',
        code: `const moduleRef = await Test.createTestingModule({
  controllers: [UsersController],
  providers: [UsersService],
}) /* ??? */ .compile();`,
        opts: [
          '.overrideProvider(UsersService).useValue(fake)',
          '.overrideModule(UsersModule).useValue(fake)',
          'Mock the module path with jest.mock first',
        ],
        a: '.overrideProvider(UsersService).useValue(fake)',
        why: 'This is the payoff of DI: swapping a dependency is one line, with no module loader tricks.',
      },
      {
        t: 3,
        q: 'A provider is registered with a string token. How do you inject it?',
        code: "{ provide: 'STRIPE', useValue: new Stripe(key) }",
        opts: [
          "constructor(@Inject('STRIPE') private s: Stripe)",
          'constructor(private stripe: Stripe) as usual',
          "@Injectable('STRIPE') on the consuming class",
        ],
        a: "constructor(@Inject('STRIPE') private s: Stripe)",
        why: 'With a class token Nest reads the type for you. With a string token there is no type to read, so you name it with @Inject.',
      },
      {
        t: 3,
        q: 'What does the inject array do in a factory provider?',
        code: `{
  provide: 'DB',
  useFactory: (config: ConfigService) => createPool(config.url),
  inject: [ConfigService],
}`,
        opts: [
          'Lists the providers Nest passes into the factory',
          'Lists the providers the factory result exports',
          'Marks the listed providers as available app-wide',
        ],
        a: 'Lists the providers Nest passes into the factory',
        why: 'useFactory + inject is how you build something that needs config or async setup before it exists.',
      },
      {
        t: 3,
        q: 'Why does NestJS need emitDecoratorMetadata turned on in tsconfig?',
        opts: [
          'So Nest can read constructor types at runtime',
          'So decorators are valid TypeScript syntax',
          'So the compiler keeps strict null checks on',
        ],
        a: 'So Nest can read constructor types at runtime',
        why: 'Types normally vanish when TypeScript compiles. That flag leaves behind the metadata Nest reads to resolve constructor arguments.',
      },
      {
        t: 2,
        q: 'A helper service is only used inside UsersModule. Should you export it?',
        opts: [
          'No. Export only what another module needs',
          'Yes. Exporting every provider is the default',
          'Only if the helper is marked @Injectable()',
        ],
        a: 'No. Export only what another module needs',
        why: "exports is your module's public API. Keeping it small is the whole point of modules.",
      },
    ],
  },
  {
    id: 'route',
    division: 'nest',
    kind: 'quiz',
    bullet: '3',
    color: '--green',
    short: 'Routing',
    name: 'Platform Signs',
    topic: 'Controllers, routes and params',
    pitch: 'Controllers are just a path prefix plus a set of signs. The traps are route order, where params come from, and which status code comes back.',
    rules: [
      'Given the decorators and a request, pick what actually happens.',
      'Route order matters more than you think.',
      'Watch which decorator pulls from where.',
    ],
    hook: '@Controller(prefix) + @Get(path) build the URL. Routes match top to bottom, first match wins.',
    par: 95,
    questions: [
      {
        t: 1,
        q: 'A request comes in for GET /users/me. Which handler runs?',
        code: `@Controller('users')
export class UsersController {
  @Get(':id')  findOne(@Param('id') id: string) {}
  @Get('me')   me() {}
}`,
        opts: [
          "findOne runs, with id = 'me'",
          'me() runs, it is more specific',
          '404, the two routes conflict',
        ],
        a: "findOne runs, with id = 'me'",
        why: 'Routes are matched in declaration order and the first match wins. Literal paths have to be declared above param routes.',
      },
      {
        t: 1,
        q: 'A POST handler returns successfully without setting a status. What does the client get?',
        code: `@Post()
create(@Body() dto: CreateUserDto) { return user; }`,
        opts: ['201 Created', '200 OK', '204 No Content'],
        a: '201 Created',
        why: 'POST defaults to 201 in Nest. Every other method defaults to 200. @HttpCode() overrides it.',
      },
      {
        t: 1,
        q: 'Which decorator gives you the parsed JSON body?',
        opts: ['@Body()', '@Param()', '@Query()'],
        a: '@Body()',
        why: '@Param reads URL segments, @Query reads the querystring, @Body reads the parsed body. Each pulls one piece instead of passing req around.',
      },
      {
        t: 1,
        q: 'Request is GET /users/42. What is the runtime type of id here, with no pipes and no transform?',
        code: `@Get(':id')
findOne(@Param('id') id: number) { /* typeof id? */ }`,
        opts: [
          'string, because URLs are text',
          'number, TypeScript converts it',
          'a number only when transform is on',
        ],
        a: 'string, because URLs are text',
        why: 'The annotation is a lie at runtime. Use @Param("id", ParseIntPipe) or ValidationPipe with transform to actually get a number.',
      },
      {
        t: 2,
        q: 'main.ts calls app.setGlobalPrefix("api"). What is the full path?',
        code: `@Controller('users')
export class UsersController { @Get() findAll() {} }`,
        opts: ['/api/users', '/users/api', '/users'],
        a: '/api/users',
        why: 'The global prefix sits in front of every controller path. Handy for versioning behind a proxy.',
      },
      {
        t: 2,
        q: 'What status does this return on success?',
        code: `@Delete(':id')
@HttpCode(204)
remove(@Param('id') id: string) { return this.users.remove(id); }`,
        opts: ['204 No Content', '200 OK anyway', '201 Created'],
        a: '204 No Content',
        why: '@HttpCode overrides the default. 204 is the usual choice for a delete that returns nothing.',
      },
      {
        t: 2,
        q: 'A handler returns a Promise<User[]>. What does Nest do?',
        opts: [
          'Awaits it and serializes the resolved value',
          'Sends the pending promise, which becomes {}',
          'Nothing, unless you call res.json yourself',
        ],
        a: 'Awaits it and serializes the resolved value',
        why: 'Nest handles promises and observables for you, which is why handlers can be plain async functions.',
      },
      {
        t: 2,
        q: 'You inject @Res() res into a handler. What changes?',
        opts: [
          'You own the response. Returning a value does nothing',
          'Nothing changes. Nest still sends what you return',
          'Interceptors keep reshaping the returned value',
        ],
        a: 'You own the response. Returning a value does nothing',
        why: 'That is library-specific mode. It opts the route out of Nest response handling, including interceptors, so avoid it unless you are streaming.',
      },
      {
        t: 2,
        q: 'Request is GET /users?page=2&limit=10. What is the value of page?',
        code: `@Get()
findAll(@Query('page') page: string) {}`,
        opts: ['"2" as a string', '2 as a number', '{ page: "2", limit: "10" }'],
        a: '"2" as a string',
        why: 'Named means one value, still text. @Query() with no name gives you the whole object.',
      },
      {
        t: 3,
        q: 'What does @Param() with no name return here?',
        code: `@Get(':id/orders/:orderId')
one(@Param() params) {}`,
        opts: [
          'An object: { id, orderId }',
          'Only the first one, id',
          'The raw path as a string',
        ],
        a: 'An object: { id, orderId }',
        why: 'Same for @Query() and @Body(). No name means the whole bag, a name means one value.',
      },
      {
        t: 3,
        q: 'A catch-all route is declared first in the controller. What happens to the routes below it?',
        opts: [
          'They never match. Declaration order wins',
          'They still match: specific routes win',
          'Nest throws a route conflict at startup',
        ],
        a: 'They never match. Declaration order wins',
        why: 'Nest does not rank by specificity. Order your routes from most specific to least.',
      },
      {
        t: 3,
        q: 'How do you apply ParseIntPipe to one parameter only?',
        opts: [
          "@Param('id', ParseIntPipe) on that parameter",
          '@UsePipes(ParseIntPipe) on the controller',
          'app.useGlobalPipes(new ParseIntPipe())',
        ],
        a: "@Param('id', ParseIntPipe) on that parameter",
        why: 'Pipes can be bound globally, per controller, per route, or to a single parameter. Smallest scope that does the job is usually right.',
      },
    ],
  },
  {
    id: 'dto',
    division: 'nest',
    kind: 'quiz',
    bullet: '4',
    color: '--yellow',
    darkText: true,
    short: 'Validation',
    name: 'Ticket Check',
    topic: 'DTOs and the ValidationPipe',
    pitch: 'A DTO is a class that describes the shape of a request body. The ValidationPipe reads the decorators on it and rejects anything that does not fit, before your handler ever runs.',
    rules: [
      'Read the DTO, the pipe settings, and the incoming body.',
      'Decide what the API sends back.',
      'Pay attention to extra fields and to types.',
    ],
    hook: 'DTO must be a class (interfaces vanish at runtime). ValidationPipe fails with 400 and a message array.',
    par: 95,
    questions: [
      {
        t: 1,
        q: 'Global ValidationPipe is on. The body arrives as { "email": "nope", "password": "secret123" }. What comes back?',
        code: `export class CreateUserDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
}`,
        opts: [
          '400 with message: ["email must be an email"]',
          '422 with the same validation message array',
          '200, and your handler validates it itself',
        ],
        a: '400 with message: ["email must be an email"]',
        why: 'ValidationPipe throws BadRequestException with a message array. Your handler never runs, so it can trust its input.',
      },
      {
        t: 1,
        q: 'Why does a DTO have to be a class instead of an interface?',
        opts: [
          'Interfaces vanish at compile time, leaving nothing to read',
          'Classes validate faster than plain objects at runtime',
          'Nest only accepts classes as handler parameters',
        ],
        a: 'Interfaces vanish at compile time, leaving nothing to read',
        why: 'The pipe reads decorator metadata off the class at runtime. This is the single most common DTO question in interviews.',
      },
      {
        t: 1,
        q: 'Your DTO has validation decorators, but main.ts never calls useGlobalPipes and no route uses @UsePipes. What happens?',
        opts: [
          'Nothing is validated. The decorators just sit there',
          'Nest applies a default ValidationPipe anyway',
          'The app fails to start with a missing pipe error',
        ],
        a: 'Nothing is validated. The decorators just sit there',
        why: 'Decorators are just metadata. Something has to read it, and that something is the ValidationPipe.',
      },
      {
        t: 2,
        q: 'ValidationPipe is configured with whitelist: true. The body includes an extra isAdmin: true. What happens?',
        opts: [
          'isAdmin is stripped before the handler sees it',
          'isAdmin triggers a 400 before the handler runs',
          'isAdmin is passed through to your service as is',
        ],
        a: 'isAdmin is stripped before the handler sees it',
        why: 'whitelist keeps only properties that carry validation decorators. It is the cheapest protection against mass-assignment bugs.',
      },
      {
        t: 2,
        q: 'Now whitelist and forbidNonWhitelisted are both true, and the body still has isAdmin: true.',
        opts: [
          '400 with "property isAdmin should not exist"',
          'The field is stripped and the request continues',
          '500, because the DTO shape no longer matches',
        ],
        a: '400 with "property isAdmin should not exist"',
        why: 'Same check, louder. Use it when you would rather fail than quietly ignore a field a client thinks it is sending.',
      },
      {
        t: 2,
        q: 'ValidationPipe has transform: true. The request is GET /users/42. What is id?',
        code: `@Get(':id')
findOne(@Param('id') id: number) {}`,
        opts: ['The number 42', 'The string "42"', '400 Bad Request'],
        a: 'The number 42',
        why: 'transform builds a real instance and converts primitives to the declared types. Without it, you get the string.',
      },
      {
        t: 2,
        q: 'What does @IsOptional() actually do?',
        opts: [
          "Skips that field's validators when it is undefined",
          'Strips that field from the validated payload',
          'Marks the matching database column nullable',
        ],
        a: "Skips that field's validators when it is undefined",
        why: 'Without it, a missing field fails its validators. With it, the rules only apply when a value is present.',
      },
      {
        t: 2,
        q: 'You need an update DTO where every field from CreateUserDto is optional. What is the clean way?',
        opts: [
          'class UpdateUserDto extends PartialType(CreateUserDto)',
          'class UpdateUserDto implements Partial<CreateUserDto>',
          'type UpdateUserDto = Partial<CreateUserDto>',
        ],
        a: 'class UpdateUserDto extends PartialType(CreateUserDto)',
        why: 'Mapped types (PartialType, PickType, OmitType) keep the validation rules and stop the two DTOs drifting apart.',
      },
      {
        t: 2,
        q: 'Which package do @IsEmail and @MinLength come from?',
        opts: ['class-validator', 'class-transformer', '@nestjs/common'],
        a: 'class-validator',
        why: 'class-validator has the rules, class-transformer does the plain-object-to-class conversion. ValidationPipe needs both installed.',
      },
      {
        t: 3,
        q: 'CreateOrderDto has an address: AddressDto field. What makes the nested object actually get validated?',
        opts: [
          '@ValidateNested() plus @Type(() => AddressDto)',
          '@IsObject() plus @Type(() => AddressDto)',
          'Nothing. Nested DTOs validate automatically',
        ],
        a: '@ValidateNested() plus @Type(() => AddressDto)',
        why: 'Nest needs to know what class to build for the nested value, and @Type is how you tell it.',
      },
      {
        t: 3,
        q: 'Where does validation sit in the request lifecycle?',
        opts: [
          'After guards and interceptors, before the handler',
          'Before guards, as the first thing that runs',
          'Inside the service, when the DTO is used',
        ],
        a: 'After guards and interceptors, before the handler',
        why: 'Pipes are stage 5. Auth rejection should not cost you a validation pass, which is part of why guards run first.',
      },
      {
        t: 3,
        q: 'What is the difference between a DTO and an entity?',
        opts: [
          'A DTO shapes a request, an entity shapes a table',
          'An entity shapes a request, a DTO shapes a table',
          'They are the same thing under two names',
        ],
        a: 'A DTO shapes a request, an entity shapes a table',
        why: 'Keeping them separate stops internal columns like passwordHash leaking into the API, and lets the two change independently.',
      },
    ],
  },
  {
    id: 'block',
    division: 'nest',
    kind: 'quiz',
    bullet: '5',
    color: '--purple',
    short: 'Which tool',
    name: 'Dispatch Desk',
    topic: 'Guards, pipes, interceptors, filters, middleware',
    pitch: 'Nest gives you five places to put cross-cutting logic. Knowing which one a job belongs in is the single most senior-sounding thing you can say in this interview.',
    rules: [
      'Read the job, pick the building block.',
      'One best answer each time, and the reason matters.',
      'This is the one to replay before the call.',
    ],
    hook: 'Middleware: raw req/res. Guard: can you? Pipe: is this input valid and the right type? Interceptor: wrap before and after. Filter: turn errors into responses.',
    par: 85,
    questions: [
      {
        t: 1,
        q: 'Reject any request whose JWT does not carry the admin role.',
        opts: [
          'Guard: is this request allowed?',
          'Interceptor: wrap the handler',
          'Param decorator: a handler shortcut',
        ],
        a: 'Guard: is this request allowed?',
        why: 'A guard answers one yes-or-no question before anything else runs. Returning false gives a 403.',
      },
      {
        t: 1,
        q: 'Convert the :id in the URL to a number, and reject with 400 if it is not one.',
        opts: [
          'Pipe: validate or convert an input',
          'Guard: is this request allowed?',
          'Filter: turn an error into a response',
        ],
        a: 'Pipe: validate or convert an input',
        why: 'Pipes transform and validate a single input. This one is built in: ParseIntPipe.',
      },
      {
        t: 1,
        q: 'Wrap every successful response in { data: ... } without touching 40 handlers.',
        opts: [
          'Interceptor: wrap the handler',
          'Middleware: raw request, pre-routing',
          'Param decorator: a handler shortcut',
        ],
        a: 'Interceptor: wrap the handler',
        why: 'Interceptors are the only piece that runs after the handler returns, so response shaping belongs there.',
      },
      {
        t: 1,
        q: 'Turn every thrown error into your standard error JSON shape, and log it.',
        opts: [
          'Filter: turn an error into a response',
          'Interceptor: wrap the handler',
          'Guard: is this request allowed?',
        ],
        a: 'Filter: turn an error into a response',
        why: 'Filters catch what was thrown and decide the response. A global one gives you a consistent error contract.',
      },
      {
        t: 2,
        q: 'Attach an x-request-id header to every incoming request before anything else runs.',
        opts: [
          'Middleware: raw request, pre-routing',
          'Interceptor: wrap the handler',
          'Param decorator: a handler shortcut',
        ],
        a: 'Middleware: raw request, pre-routing',
        why: 'Middleware is first in line and works on the raw request, before Nest has matched a handler.',
      },
      {
        t: 2,
        q: 'Log how long each request takes, including time spent inside the service.',
        opts: [
          'Interceptor: wrap the handler',
          'Middleware: raw request, pre-routing',
          'Filter: turn an error into a response',
        ],
        a: 'Interceptor: wrap the handler',
        why: 'You need both sides of the handler to measure it. Start a timer before next.handle(), read it in the pipe(tap(...)).',
      },
      {
        t: 2,
        q: 'Give every handler a @CurrentUser() shortcut instead of reaching into req.user.',
        opts: [
          'Param decorator: a handler shortcut',
          'Guard: is this request allowed?',
          'Pipe: validate or convert an input',
        ],
        a: 'Param decorator: a handler shortcut',
        why: 'The guard puts user on the request. The decorator is just a tidy way to pull it out in handlers.',
      },
      {
        t: 2,
        q: 'Make sure passwordHash never appears in any serialized user.',
        opts: [
          'Interceptor: wrap the handler',
          'Pipe: validate or convert an input',
          'Middleware: raw request, pre-routing',
        ],
        a: 'Interceptor: wrap the handler',
        why: 'Serialization happens on the way out, so it is interceptor territory. whitelist only protects incoming data.',
      },
      {
        t: 2,
        q: 'A global auth guard is on, but /health has to stay public.',
        opts: [
          'Guard: is this request allowed?',
          'Interceptor: wrap the handler',
          'Middleware: raw request, pre-routing',
        ],
        a: 'Guard: is this request allowed?',
        why: 'Reflector reads route metadata inside the guard. That pattern (@Roles, @Public) shows up in every real Nest codebase.',
      },
      {
        t: 3,
        q: 'Cache GET responses for 30 seconds.',
        opts: [
          'Interceptor: wrap the handler',
          'Middleware: raw request, pre-routing',
          'Guard: is this request allowed?',
        ],
        a: 'Interceptor: wrap the handler',
        why: 'A cache has to short-circuit before the handler and store what comes back after it. Only interceptors see both.',
      },
      {
        t: 3,
        q: 'Rate limit by IP, before any handler work happens.',
        opts: [
          'Guard: is this request allowed?',
          'Pipe: validate or convert an input',
          'Interceptor: wrap the handler',
        ],
        a: 'Guard: is this request allowed?',
        why: 'It is a yes-or-no gate on the request, so Nest ships it as a guard.',
      },
      {
        t: 3,
        q: 'Run an existing Express library like helmet or cookie-parser.',
        opts: [
          'Middleware: raw request, pre-routing',
          'Interceptor: wrap the handler',
          'Guard: is this request allowed?',
        ],
        a: 'Middleware: raw request, pre-routing',
        why: 'Middleware is the Express-compatible layer. That is exactly what it is for.',
      },
    ],
  },
  {
    id: 'err',
    division: 'nest',
    kind: 'quiz',
    bullet: '6',
    color: '--orange',
    short: 'Errors',
    name: 'Fault Line',
    topic: 'Exceptions and status codes',
    pitch: 'Nest turns thrown exceptions into HTTP responses for you. Knowing which exception maps to which status code (and what happens when you throw something random) saves you in both interviews and production.',
    rules: [
      'Pick the status code or the behavior.',
      'Built-in exceptions are just classes with a status attached.',
      'Anything Nest does not recognize becomes a 500.',
    ],
    hook: 'throw new NotFoundException() → 404. Guard returns false → 403. Plain Error → 500 with the message hidden.',
    par: 85,
    questions: [
      {
        t: 1,
        q: 'A service runs: throw new NotFoundException("User 7 not found"). What does the client get?',
        opts: [
          '404 with a statusCode, message and error body',
          '500, since the throw came from the service',
          '400, because the id matched no record',
        ],
        a: '404 with a statusCode, message and error body',
        why: 'Built-in exceptions already carry their status. Nest catches them and builds the response, so services stay free of HTTP plumbing.',
      },
      {
        t: 1,
        q: 'An auth guard returns false. What does the client get?',
        opts: ['403 Forbidden', '401 Unauthorized', '500 Internal Server Error'],
        a: '403 Forbidden',
        why: 'Returning false throws ForbiddenException. If you want a 401 or a custom message, throw UnauthorizedException from the guard instead.',
      },
      {
        t: 1,
        q: 'A library inside your service throws a plain Error("connection lost"). What does the client see?',
        opts: [
          '500 with a generic message, text hidden',
          "500 with 'connection lost' in the body",
          '400 with the error message attached',
        ],
        a: '500 with a generic message, text hidden',
        why: 'Nest only trusts HttpException. Everything else becomes a safe 500, which is why you log the original in a global filter.',
      },
      {
        t: 2,
        q: 'ValidationPipe rejects the body. Which status code?',
        opts: ['400 Bad Request', '422 Unprocessable Entity', '409 Conflict'],
        a: '400 Bad Request',
        why: 'BadRequestException with a message array is the default. You can switch it to 422 with exceptionFactory if your API prefers that.',
      },
      {
        t: 2,
        q: 'throw new HttpException("I am a teapot", 418). What comes back?',
        opts: ['418 with that message', '500, because 418 is not a built-in', '400'],
        a: '418 with that message',
        why: 'HttpException is the base class: a body and a status. The named ones are just subclasses with the status filled in.',
      },
      {
        t: 2,
        q: 'When do you use 401 versus 403?',
        opts: [
          '401 means not authenticated, 403 means not allowed',
          '401 means not allowed, 403 means not authenticated',
          'They mean the same thing, so pick either one',
        ],
        a: '401 means not authenticated, 403 means not allowed',
        why: 'Missing or expired token is 401. Valid token without the right role is 403.',
      },
      {
        t: 2,
        q: 'Signup hits a unique constraint because the email already exists. Which exception fits?',
        opts: [
          'ConflictException (409)',
          'BadRequestException (400)',
          'NotFoundException (404)',
        ],
        a: 'ConflictException (409)',
        why: '409 says the request is fine but conflicts with current state. Catch the database error and rethrow it as a domain exception.',
      },
      {
        t: 2,
        q: 'What is the default Nest error body shape?',
        opts: [
          '{ statusCode, message, error }',
          '{ ok: false, error, at, path }',
          '{ status, title, detail }',
        ],
        a: '{ statusCode, message, error }',
        why: 'message can be a string or an array (validation). Teams usually standardize it with a global exception filter.',
      },
      {
        t: 2,
        q: '@Catch() with no arguments catches what?',
        opts: [
          'Everything thrown, including non-HTTP errors',
          'Only HttpException and the classes extending it',
          'Nothing until you pass it an exception type',
        ],
        a: 'Everything thrown, including non-HTTP errors',
        why: '@Catch(HttpException) narrows it. A bare @Catch() is how you build the one filter that logs everything.',
      },
      {
        t: 3,
        q: 'A route has @UseFilters(RouteFilter) and the app has a global filter. Both match the thrown error. Which one handles it?',
        opts: [
          'The route-level filter, the closest match',
          'Both, route first and then the global one',
          'The global one, registered earliest wins',
        ],
        a: 'The route-level filter, the closest match',
        why: 'The closest matching filter wins. Filters resolve route, then controller, then global.',
      },
      {
        t: 3,
        q: 'Where should domain errors like "user not found" be thrown?',
        opts: [
          'In the service, and let Nest map it to a response',
          'In the controller, after checking the result',
          'In middleware, before the handler is picked',
        ],
        a: 'In the service, and let Nest map it to a response',
        why: 'It keeps controllers thin and the rule in one place. The service throws, Nest translates.',
      },
      {
        t: 3,
        q: 'You want a guard to return 401 with "token expired" instead of a bare 403.',
        opts: [
          'throw new UnauthorizedException() from the guard',
          'return false and set res.status(401) yourself',
          'throw it from a pipe bound to that route',
        ],
        a: 'throw new UnauthorizedException() from the guard',
        why: 'Guards can throw as well as return false, and throwing is how you control the status and the message.',
      },
    ],
  },
];

/** Field guide for the NestJS division, including interview talking points. */
export const NEST_GUIDE: Record<NestLineId, Guide> = {
  life: {
    plain: 'A request does not go straight to your function. It walks through a fixed line of checkpoints, and each one can stop it. Middleware sees the raw request first. Guards decide if it is allowed through at all. Interceptors start a timer around everything after them. Pipes validate and convert the inputs. Then your handler runs, usually calling a service. On the way back out, the interceptors finish (that is where you reshape the response), and if anything threw along the way, an exception filter turns it into an HTTP response.',
    words: [
      [
        'middleware',
        'Runs first, before Nest knows which handler is involved. Plain req/res/next, same idea as Express.',
      ],
      [
        'guard',
        'A yes or no decision. Returns true to continue, false to reject with 403.',
      ],
      [
        'interceptor',
        'Wraps the handler. Code before it runs, and code after it returns, in the same class.',
      ],
      [
        'pipe',
        'Transforms and validates an input value right before the handler gets it.',
      ],
      [
        'exception filter',
        'Catches thrown errors and decides what HTTP response goes back.',
      ],
      [
        'global vs controller vs route',
        'Where you attached it. Globals run first on the way in, last on the way out.',
      ],
    ],
    code: {
      label: 'the whole line in one picture',
      snippet: `// 1 middleware    app.use() / configure(consumer)
// 2 guards        @UseGuards(AuthGuard)
// 3 interceptors  @UseInterceptors(LoggingInterceptor)   <-- before
// 4 pipes         @Body() dto  +  ValidationPipe
// 5 handler       @Post() create(@Body() dto) { ... }
// 6 service       this.usersService.create(dto)
// 7 interceptors  map(data => ({ data }))                <-- after
// 8 filters       @Catch() AllExceptionsFilter
// 9 response`,
    },
    say: [
      'Middleware, guards, interceptors, pipes, handler, service, interceptors again, filters, response.',
      'Within each stage it goes global, then controller, then route. On the way out it reverses, so route interceptors finish first.',
      'A guard rejecting means pipes and the handler never run at all, which is why auth belongs in a guard and not in the service.',
      'Interceptors are the only piece that sees both sides of the handler, so timing, caching and response shaping live there.',
    ],
    gotcha: 'Middleware runs before guards, so anything that needs to know which handler was matched cannot live in middleware. Use a guard or interceptor instead.',
    rehearse: [
      {
        prompt: 'Walk me through what happens when a request hits a NestJS app.',
        answer: 'Middleware, then guards, then interceptors, then pipes, then the route handler and whatever services it calls. On the way back out the interceptors finish, and if anything threw, an exception filter turns it into the response.',
      },
      {
        prompt: 'Why does auth belong in a guard instead of the service?',
        answer: 'A guard runs before pipes and the handler, so a rejected request never costs validation or business logic, and the rule lives in one place instead of being repeated in every service method.',
      },
      {
        prompt: 'What can an interceptor do that middleware cannot?',
        answer: 'An interceptor wraps the handler and has the execution context, so it can time the call, cache it, or reshape the response. Middleware runs before Nest has even matched a handler, so it has none of that.',
      },
    ],
  },
  di: {
    plain: "You never call new on a service in NestJS. You list a class in a module's providers, type it in a constructor, and Nest builds it for you and hands it over. That only works if Nest can see the class from where you are asking. A module's providers are private to that module. To let another module use one, the owning module has to put it in exports, and the other module has to put the owning module in imports.",
    words: [
      [
        'provider',
        'Anything Nest can inject: usually a service class marked @Injectable().',
      ],
      [
        'module',
        'A box that groups providers and controllers, and declares what it imports and exports.',
      ],
      [
        'imports',
        'Other modules whose exported providers this module can use.',
      ],
      [
        'exports',
        'The providers this module makes available to modules that import it.',
      ],
      [
        'token',
        'The key Nest looks up when injecting. Usually the class itself, sometimes a string like "CONFIG".',
      ],
      [
        'scope',
        'DEFAULT is one shared instance (singleton). REQUEST makes a new one per request. TRANSIENT makes a new one per consumer.',
      ],
    ],
    code: {
      label: 'the three-part handshake',
      snippet: `@Module({
  providers: [UsersService],   // built here
  exports: [UsersService],     // visible to importers
})
export class UsersModule {}

@Module({
  imports: [UsersModule],      // now OrdersService can inject it
  providers: [OrdersService],
})
export class OrdersModule {}`,
    },
    say: [
      'Providers are private to their module. Exporting makes them public, importing is how you ask.',
      "When I see \"Nest can't resolve dependencies\", I check four things: is the class in providers, is it exported, is the module imported, and is the class marked @Injectable().",
      'Everything is a singleton by default, which is what you want. Request scope bubbles up: if a service is request-scoped, anything injecting it becomes request-scoped too, and that costs performance.',
      'For tests I use Test.createTestingModule with overrideProvider and useValue to swap in a fake, which is only possible because of DI.',
    ],
    gotcha: 'Two modules that each list the same service in providers get two separate instances. If the service holds state, that bites. Export it from one module and import that module instead.',
    rehearse: [
      {
        prompt: "You get \"Nest can't resolve dependencies of OrdersService\". How do you debug it?",
        answer: 'Four checks: is the class in providers, is it exported by its own module, is that module imported where I need it, and is it marked @Injectable. If two services need each other, that is forwardRef.',
      },
      {
        prompt: 'What does dependency injection actually buy you here?',
        answer: 'I never construct services by hand, so swapping one for a fake in a test is a single overrideProvider call, and the module graph documents what depends on what.',
      },
      {
        prompt: 'When would you use a request-scoped provider?',
        answer: 'Rarely. The default singleton is what you want. Request scope bubbles up to everything that injects it and costs performance, so I use it only when a provider truly has to hold per-request state.',
      },
    ],
  },
  route: {
    plain: 'A controller is a class with a path prefix. Each method gets an HTTP method decorator and a path piece, and Nest glues them together into a route. Parameters do not come from one magic req object. You pull each piece with its own decorator: @Param for the URL, @Query for the querystring, @Body for the parsed body, @Headers for headers. Whatever you return gets serialized to JSON for you.',
    words: [
      ['@Controller("users")', 'Path prefix for every route in the class.'],
      [
        '@Get(":id")',
        'HTTP method plus the rest of the path. Colon means a URL parameter.',
      ],
      [
        '@Param / @Query / @Body',
        'Pull one piece of the request. With a name, you get that single value.',
      ],
      ['@HttpCode(204)', 'Override the default status code.'],
      [
        'setGlobalPrefix("api")',
        'Puts a prefix in front of every route in the app.',
      ],
    ],
    code: {
      label: 'a controller worth copying',
      snippet: `@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')                       // declare BEFORE :id
  me(@Headers('authorization') auth: string) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {}

  @Post()                          // 201 by default
  create(@Body() dto: CreateUserDto) {}
}`,
    },
    say: [
      'Routes are matched in declaration order, so a literal path like /users/me has to be declared above /users/:id or the param route swallows it.',
      'POST returns 201 by default, everything else 200, and @HttpCode changes that.',
      'I return plain objects and let Nest serialize. Reaching for @Res() opts you out of the whole pipeline, including interceptors.',
      'ParseIntPipe inside @Param does the string to number conversion and throws a 400 if it is not a number, so the handler only ever sees valid input.',
    ],
    gotcha: 'Injecting @Res() switches that handler into library-specific mode. Nest stops handling the response, so returning a value does nothing and interceptors stop applying.',
    rehearse: [
      {
        prompt: 'How do you structure a controller?',
        answer: 'Thin. It maps a route to a service call, pulls what it needs with @Param, @Query and @Body, and returns a plain object for Nest to serialize. The logic lives in the service.',
      },
      {
        prompt: 'What is the trap with route order?',
        answer: 'Routes match in declaration order and the first match wins, so a literal path like /users/me has to be declared above /users/:id or the param route swallows it.',
      },
    ],
  },
  dto: {
    plain: 'A DTO (data transfer object) is a class that describes what you accept. You decorate its fields with rules from class-validator, and the ValidationPipe checks the incoming JSON against them before your handler runs. If something fails, the client gets a 400 with a list of messages, and your code never sees the bad data. It has to be a class and not an interface, because interfaces disappear when TypeScript compiles and there would be nothing left to read at runtime.',
    words: [
      ['DTO', 'A class describing the shape of input. Not a database entity.'],
      [
        'class-validator',
        'The library behind @IsEmail(), @MinLength(8), @IsOptional() and friends.',
      ],
      ['whitelist', 'Strips any field that has no validation decorator.'],
      [
        'forbidNonWhitelisted',
        'Instead of stripping unknown fields, reject the request with a 400.',
      ],
      [
        'transform',
        'Turns the plain JSON into a real instance of the DTO class, and converts primitives to the declared types.',
      ],
      [
        'PartialType',
        'Makes every field of another DTO optional. Handy for PATCH.',
      ],
    ],
    code: {
      label: 'the setup that catches bad input',
      snippet: `// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // drop unknown fields
  forbidNonWhitelisted: true, // or 400 on them
  transform: true,            // real class instance + type coercion
}));

// create-user.dto.ts
export class CreateUserDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
  @IsOptional() @IsInt() age?: number;
}`,
    },
    say: [
      'DTOs are classes, not interfaces, because the ValidationPipe reads decorator metadata at runtime and an interface leaves nothing behind.',
      'I turn on whitelist and forbidNonWhitelisted globally so unexpected fields never reach the service layer.',
      'Validation failures come back as 400 with a message array, and because the pipe runs before the handler, the handler can trust its input.',
      'DTOs describe the request. Entities describe the database. Keeping them separate stops internal columns leaking into the API.',
    ],
    gotcha: 'Validation decorators do nothing until a ValidationPipe is actually applied. Add it with app.useGlobalPipes in main.ts, and remember it needs both class-validator and class-transformer installed.',
    rehearse: [
      {
        prompt: 'What is a DTO, and why does it have to be a class?',
        answer: 'It describes the shape of the request. It has to be a class because the ValidationPipe reads decorator metadata at runtime, and an interface disappears when TypeScript compiles.',
      },
      {
        prompt: 'How do you keep bad input out of your services?',
        answer: 'A global ValidationPipe with whitelist, forbidNonWhitelisted and transform, plus DTOs carrying class-validator rules. The handler then only ever sees input that already passed.',
      },
    ],
  },
  block: {
    plain: 'Nest has five places to put logic that is not really about one endpoint. Middleware is the rawest and runs first, before Nest knows which route matched. A guard answers one yes-or-no question: is this request allowed. A pipe works on a single input value: validate it, convert it. An interceptor wraps the handler, so it can start a timer, cache, or reshape what comes back. A filter is the catcher at the end that turns thrown errors into responses.',
    words: [
      [
        'middleware',
        'Runs first, no handler context. Good for request ids, raw body, legacy Express middleware.',
      ],
      [
        'guard',
        'Returns true or false. Auth, roles, feature flags. Can read route metadata with Reflector.',
      ],
      [
        'pipe',
        'Validates or transforms one argument. ParseIntPipe, ValidationPipe, your own.',
      ],
      [
        'interceptor',
        'Code before and after the handler. Logging, timing, caching, response shaping.',
      ],
      ['exception filter', '@Catch() a type of error, decide the response.'],
      [
        'custom decorator',
        'createParamDecorator gives handlers a shortcut like @CurrentUser().',
      ],
    ],
    code: {
      label: 'one of each, for shape',
      snippet: `@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    const roles = this.reflector.get<string[]>('roles', ctx.getHandler());
    const { user } = ctx.switchToHttp().getRequest();
    return !roles || roles.some(r => user.roles.includes(r));
  }
}

@Injectable()
export class WrapInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const started = Date.now();
    return next.handle().pipe(
      map(data => ({ data, ms: Date.now() - started })),
    );
  }
}`,
    },
    say: [
      'Guards answer "is this allowed", interceptors wrap the call, pipes handle one input, filters handle the way out.',
      'Auth goes in a guard, not in the service, because a guard runs before pipes and the handler and keeps that logic in one place.',
      'Anything that needs both sides of the handler (timing, caching, response envelopes, serialization) has to be an interceptor.',
      'Middleware is my last choice, because it runs before Nest knows the route and gets none of the execution context.',
    ],
    gotcha: 'Guards and interceptors can read route metadata through Reflector, which is how @Roles() and @Public() style decorators work. Middleware cannot, because the handler has not been resolved yet.',
    rehearse: [
      {
        prompt: 'Where do you put cross-cutting logic in Nest?',
        answer: 'Guards for allowed or not, pipes for validating and converting one input, interceptors for anything that needs both sides of the handler, filters for turning errors into responses, and middleware for raw request work before routing.',
      },
      {
        prompt: 'A global auth guard is on. How do you make one route public?',
        answer: 'Set metadata on the handler with a @Public() decorator and read it inside the guard with Reflector, so the exception lives next to the rule instead of removing the guard.',
      },
    ],
  },
  err: {
    plain: 'When you throw an HttpException (or one of its built-in subclasses like NotFoundException), Nest catches it and sends back the matching status code with a JSON body. You do not touch res.status. Anything Nest does not recognize, like a plain Error from a library, becomes a 500 with the real message hidden, which is deliberate: internal errors should not leak to clients.',
    words: [
      ['HttpException', 'Base class: new HttpException(body, status).'],
      [
        'built-in exceptions',
        'NotFound 404, BadRequest 400, Unauthorized 401, Forbidden 403, Conflict 409, UnprocessableEntity 422.',
      ],
      [
        'exception filter',
        'A class with @Catch() that formats errors into responses.',
      ],
      [
        '@Catch(HttpException)',
        'Only catches that type. Bare @Catch() catches everything.',
      ],
      [
        '401 vs 403',
        '401 is "I do not know who you are". 403 is "I know, and no".',
      ],
    ],
    code: {
      label: 'throwing and catching',
      snippet: `// in a service
const user = await this.repo.findOne({ where: { id } });
if (!user) throw new NotFoundException(\`User \${id} not found\`);
// response: 404 { statusCode: 404, message: "User 7 not found", error: "Not Found" }

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(err: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const status = err instanceof HttpException ? err.getStatus() : 500;
    res.status(status).json({ ok: false, status, at: new Date().toISOString() });
  }
}`,
    },
    say: [
      'I throw domain exceptions from the service layer and let Nest map them to status codes. Controllers stay thin.',
      'A guard returning false produces a 403. If I need a different message or a 401, I throw the exception from the guard instead of returning false.',
      'Unknown errors become a 500 with the message stripped, which is the right default. A global filter is where I add logging and a consistent error shape.',
      'I keep 401 and 403 straight: not authenticated versus authenticated but not allowed.',
    ],
    gotcha: 'Throwing a plain Error gives the client a generic 500 and hides your message. That is good for safety and terrible for debugging, so log the original error in a global filter.',
    rehearse: [
      {
        prompt: 'How do you handle errors in a Nest service?',
        answer: 'I throw domain exceptions like NotFoundException or ConflictException and let Nest map them to status codes, so controllers stay thin. A global filter adds logging and one consistent error shape.',
      },
      {
        prompt: 'What happens when something throws that is not an HttpException?',
        answer: 'It comes back as a 500 with the message hidden, which is the right default for safety. That is exactly why I log the original error inside a global filter.',
      },
    ],
  },
};
